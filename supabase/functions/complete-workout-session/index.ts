import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type WorkoutSetRow = {
  weight: number;
  reps: number;
  set_type: string;
  is_completed: boolean;
};

// Mirrors @overload/core-engine calculatePowerFromWorkout for server-side completion.
function calculateTotalVolume(sets: WorkoutSetRow[]): number {
  return sets.reduce((total, set) => {
    if (!set.is_completed || set.set_type !== "working") {
      return total;
    }
    return total + set.weight * set.reps;
  }, 0);
}

function calculatePowerAwarded(totalVolume: number, workingSetCount: number): number {
  if (workingSetCount === 0) {
    return 0;
  }
  const basePower = Math.round((totalVolume / 62.5) * 100) / 100;
  return Math.max(1, basePower);
}

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

    const { sessionId, clientMutationId } = await request.json();
    if (!sessionId || !clientMutationId) {
      return new Response(JSON.stringify({ error: "sessionId and clientMutationId are required" }), {
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

    const { data: session, error: sessionError } = await userClient
      .from("workout_sessions")
      .select("id, user_id, status, completed_at, total_volume, power_awarded")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Workout session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.status === "completed") {
      return new Response(
        JSON.stringify({
          sessionId: session.id,
          totalVolume: session.total_volume ?? 0,
          powerAwarded: session.power_awarded ?? 0,
          status: "completed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: sets, error: setsError } = await userClient
      .from("workout_sets")
      .select("weight, reps, set_type, is_completed")
      .eq("session_id", sessionId)
      .eq("is_completed", true);

    if (setsError) {
      throw setsError;
    }

    const completedSets = (sets ?? []) as WorkoutSetRow[];
    if (completedSets.length === 0) {
      return new Response(JSON.stringify({ error: "At least one completed set is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalVolume = calculateTotalVolume(completedSets);
    const workingSetCount = completedSets.filter((set) => set.set_type === "working").length;
    const powerAwarded = calculatePowerAwarded(totalVolume, workingSetCount);
    const completedAt = new Date().toISOString();

    const { error: updateError } = await adminClient
      .from("workout_sessions")
      .update({
        status: "completed",
        completed_at: completedAt,
        total_volume: totalVolume,
        power_awarded: powerAwarded,
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    await adminClient.from("game_events").insert({
      user_id: user.id,
      event_type: "workout_completed",
      source_type: "workout_session",
      source_id: sessionId,
      power_delta: powerAwarded,
      metadata: {
        clientMutationId,
        totalVolume,
      },
    });

    const { data: existingState } = await adminClient
      .from("game_state")
      .select("power_balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingState) {
      await adminClient
        .from("game_state")
        .update({
          power_balance: Number(existingState.power_balance ?? 0) + powerAwarded,
        })
        .eq("user_id", user.id);
    } else {
      await adminClient.from("game_state").insert({
        user_id: user.id,
        power_balance: powerAwarded,
      });
    }

    return new Response(
      JSON.stringify({
        sessionId,
        totalVolume,
        powerAwarded,
        status: "completed",
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
