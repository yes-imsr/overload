import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  loadEconomySnapshot,
} from "../_shared/economy.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { clientMutationId } = await request.json();
    if (!clientMutationId) {
      return new Response(JSON.stringify({ error: "clientMutationId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nowIso = new Date().toISOString();
    const before = await loadEconomySnapshot(adminClient, user.id, nowIso);

    if (before.pendingCredits <= 0) {
      return new Response(
        JSON.stringify({
          creditsClaimed: 0,
          snapshot: before,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const nextCreditsBalance = before.creditsBalance + before.pendingCredits;

    const { error: updateError } = await adminClient
      .from("game_state")
      .update({
        credits_balance: nextCreditsBalance,
        last_idle_claim_at: nowIso,
        idle_rate: before.idleRate,
      })
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    await adminClient.from("game_events").insert({
      user_id: user.id,
      event_type: "credits_claimed",
      source_type: "system",
      source_id: null,
      credits_delta: before.pendingCredits,
      metadata: {
        clientMutationId,
        elapsedHours: before.elapsedHours,
        idleRate: before.idleRate,
        powerBalance: before.powerBalance,
      },
    });

    const snapshot = await loadEconomySnapshot(adminClient, user.id, nowIso);

    return new Response(
      JSON.stringify({
        creditsClaimed: before.pendingCredits,
        snapshot,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
