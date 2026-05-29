import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type StabilityTaskRow = {
  id: string;
  user_id: string;
  status: "pending_reveal" | "active";
  effect_value: number | null;
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

    const { data: existingTask, error: existingTaskError } = await adminClient
      .from("debuffs")
      .select("id, user_id, status, effect_value")
      .eq("user_id", user.id)
      .eq("debuff_type", "power_gain_reduction")
      .in("status", ["pending_reveal", "active"])
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingTaskError) {
      throw existingTaskError;
    }

    const task = existingTask as StabilityTaskRow | null;
    if (!task) {
      return new Response(JSON.stringify({ error: "No active Stability Task" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (task.status === "active") {
      return new Response(
        JSON.stringify({
          stabilityTaskId: task.id,
          status: "active",
          effectValue: Number(task.effect_value ?? 0.15),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const revealedAt = new Date().toISOString();
    const { error: updateError } = await adminClient
      .from("debuffs")
      .update({
        status: "active",
        revealed_at: revealedAt,
      })
      .eq("id", task.id)
      .eq("user_id", user.id)
      .eq("status", "pending_reveal");

    if (updateError) {
      throw updateError;
    }

    const { error: stateError } = await adminClient
      .from("game_state")
      .update({
        current_debuff_id: task.id,
        status: "debuffed",
      })
      .eq("user_id", user.id);

    if (stateError) {
      throw stateError;
    }

    const { error: eventError } = await adminClient.from("game_events").insert({
      user_id: user.id,
      event_type: "debuff_revealed",
      source_type: "debuff",
      source_id: task.id,
      metadata: {
        label: "Stability Task",
        source: "Entropy Spike",
      },
    });

    if (eventError) {
      throw eventError;
    }

    return new Response(
      JSON.stringify({
        stabilityTaskId: task.id,
        status: "active",
        revealedAt,
        effectValue: Number(task.effect_value ?? 0.15),
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
