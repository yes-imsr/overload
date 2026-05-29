import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveStabilityTask } from "../_shared/core-engine.bundle.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GameStateRow = {
  entropy: number | null;
  current_debuff_id: string | null;
};

type StabilityTaskRow = {
  id: string;
  status: "active";
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

    const { data: task, error: taskError } = await adminClient
      .from("debuffs")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("debuff_type", "power_gain_reduction")
      .eq("status", "active")
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (taskError) {
      throw taskError;
    }

    const stabilityTask = task as StabilityTaskRow | null;
    if (!stabilityTask) {
      return new Response(JSON.stringify({ error: "No active Stability Task" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: state, error: stateError } = await adminClient
      .from("game_state")
      .select("entropy, current_debuff_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (stateError) {
      throw stateError;
    }

    const gameState = state as GameStateRow | null;
    const resolution = resolveStabilityTask({
      currentEntropy: Number(gameState?.entropy ?? 0),
    });
    const resolvedAt = new Date().toISOString();

    const { error: updateTaskError } = await adminClient
      .from("debuffs")
      .update({
        status: "resolved",
        resolved_at: resolvedAt,
      })
      .eq("id", stabilityTask.id)
      .eq("user_id", user.id)
      .eq("status", "active");

    if (updateTaskError) {
      throw updateTaskError;
    }

    const { error: stateUpdateError } = await adminClient
      .from("game_state")
      .update({
        entropy: resolution.entropyAfter,
        current_debuff_id:
          gameState?.current_debuff_id === stabilityTask.id
            ? null
            : gameState?.current_debuff_id ?? null,
        status: "active",
      })
      .eq("user_id", user.id);

    if (stateUpdateError) {
      throw stateUpdateError;
    }

    const { error: eventError } = await adminClient.from("game_events").insert({
      user_id: user.id,
      event_type: "debuff_resolved",
      source_type: "debuff",
      source_id: stabilityTask.id,
      entropy_delta: resolution.entropyDelta,
      metadata: {
        label: "Stability Task",
        action: "Recovery Challenge",
      },
    });

    if (eventError) {
      throw eventError;
    }

    return new Response(
      JSON.stringify({
        stabilityTaskId: stabilityTask.id,
        status: "resolved",
        resolvedAt,
        entropy: resolution.entropyAfter,
        entropyDelta: resolution.entropyDelta,
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
