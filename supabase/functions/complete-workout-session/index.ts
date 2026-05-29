import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { calculatePowerFromWorkout } from "../_shared/core-engine.bundle.mjs";
import {
  recommendProgressionForSessionFromRpe,
  type ProgressionRecommendation,
} from "../_shared/progression.ts";
import type { AdminClient } from "../_shared/supabase-types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RpeLabel = "easy" | "medium" | "hard" | "near_death";

type WorkoutSetRow = {
  exercise_id: string;
  weight: number;
  reps: number;
  set_type: string;
  is_completed: boolean;
  rpe_label: RpeLabel | null;
};

type TemplateExerciseRow = {
  id: string;
  exercise_id: string;
  target_rep_min: number | null;
  target_rep_max: number | null;
  planned_weight: number | null;
};

function calculateTotalVolume(sets: WorkoutSetRow[]): number {
  return sets.reduce((total, set) => {
    if (!set.is_completed || set.set_type !== "working") {
      return total;
    }
    return total + set.weight * set.reps;
  }, 0);
}

function collectEffortsByExercise(sets: WorkoutSetRow[]): Map<string, RpeLabel[]> {
  const effortsByExercise = new Map<string, RpeLabel[]>();

  for (const set of sets) {
    if (!set.is_completed || set.set_type !== "working" || !set.rpe_label) {
      continue;
    }
    const existing = effortsByExercise.get(set.exercise_id) ?? [];
    existing.push(set.rpe_label);
    effortsByExercise.set(set.exercise_id, existing);
  }

  return effortsByExercise;
}

async function applyTemplateProgression(
  adminClient: AdminClient,
  templateId: string,
  effortsByExercise: Map<string, RpeLabel[]>,
  completedSets: WorkoutSetRow[],
): Promise<readonly ProgressionRecommendation[]> {
  const { data: templateRows, error } = await adminClient
    .from("workout_template_exercises")
    .select("id, exercise_id, target_rep_min, target_rep_max, planned_weight")
    .eq("template_id", templateId);

  if (error || !templateRows?.length) {
    return [];
  }

  const lastWeightByExercise = new Map<string, number>();
  for (const set of completedSets) {
    if (!set.is_completed || set.set_type !== "working") {
      continue;
    }
    const current = lastWeightByExercise.get(set.exercise_id) ?? 0;
    if (set.weight >= current) {
      lastWeightByExercise.set(set.exercise_id, set.weight);
    }
  }

  const targets = (templateRows as TemplateExerciseRow[]).map((row) => ({
    exerciseId: row.exercise_id,
    currentWeight: Number(
      lastWeightByExercise.get(row.exercise_id) ?? row.planned_weight ?? 0,
    ),
    currentRepTarget: Number(row.target_rep_max ?? row.target_rep_min ?? 8),
  }));

  const recommendations = recommendProgressionForSessionFromRpe(targets, effortsByExercise);

  for (const recommendation of recommendations) {
    const row = (templateRows as TemplateExerciseRow[]).find(
      (entry) => entry.exercise_id === recommendation.exerciseId,
    );
    if (!row) {
      continue;
    }

    const nextWeight =
      recommendation.nextWeight > 0 ? recommendation.nextWeight : row.planned_weight;
    const repMin = recommendation.nextRepTarget;
    const repMax = Math.max(repMin, Number(row.target_rep_max ?? repMin));

    await adminClient
      .from("workout_template_exercises")
      .update({
        planned_weight: nextWeight,
        target_rep_min: repMin,
        target_rep_max: repMax,
        progression_reason_code: recommendation.reasonCode,
      })
      .eq("id", row.id);
  }

  return recommendations;
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
      .select("id, user_id, template_id, status, completed_at, total_volume, power_awarded")
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
      .select("exercise_id, weight, reps, set_type, is_completed, rpe_label")
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
    const { powerAwarded } = calculatePowerFromWorkout({
      totalVolume,
      totalWorkingSets: workingSetCount,
    });
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

    let progressionUpdates: readonly ProgressionRecommendation[] = [];
    if (session.template_id) {
      const effortsByExercise = collectEffortsByExercise(completedSets);
      progressionUpdates = await applyTemplateProgression(
        adminClient,
        session.template_id,
        effortsByExercise,
        completedSets,
      );
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
        progressionUpdates,
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
        progressionUpdates,
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
