import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  applyPowerGainModifier,
  calculateEntropyAfterWorkout,
  calculateEntropyFromMissedWork,
  calculatePowerFromWorkout,
  evaluateStabilityTaskAssignment,
} from "../_shared/core-engine.bundle.mjs";
import {
  recommendProgressionForSessionFromRpe,
  type ProgressionRecommendation,
} from "../_shared/progression.ts";

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

type GameStateRow = {
  power_balance: number | null;
  entropy: number | null;
  current_debuff_id: string | null;
  status: "active" | "prestige_locked" | "debuffed";
};

type StabilityTaskRow = {
  id: string;
  status: "pending_reveal" | "active" | "resolved" | "expired";
  effect_value: number | null;
};

const millisecondsPerDay = 86_400_000;

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

function daysBetween(startIso: string | null | undefined, endIso: string): number {
  if (!startIso) {
    return 0;
  }

  const startTime = new Date(startIso).getTime();
  const endTime = new Date(endIso).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return 0;
  }

  return Math.floor((endTime - startTime) / millisecondsPerDay);
}

function collectWorkingExerciseIds(sets: WorkoutSetRow[]): string[] {
  return [
    ...new Set(
      sets
        .filter((set) => set.is_completed && set.set_type === "working")
        .map((set) => set.exercise_id),
    ),
  ];
}

async function countStaleExerciseSignals(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  exerciseIds: string[],
): Promise<number> {
  if (exerciseIds.length === 0) {
    return 0;
  }

  const { data, error } = await adminClient
    .from("exercise_calibrations")
    .select("exercise_id, calibration_status")
    .eq("user_id", userId)
    .in("exercise_id", exerciseIds);

  if (error) {
    throw error;
  }

  return new Set(
    (data ?? [])
      .filter((row) => row.calibration_status === "stale")
      .map((row) => row.exercise_id),
  ).size;
}

async function fetchOpenStabilityTask(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<StabilityTaskRow | null> {
  const { data, error } = await adminClient
    .from("debuffs")
    .select("id, status, effect_value")
    .eq("user_id", userId)
    .eq("debuff_type", "power_gain_reduction")
    .in("status", ["pending_reveal", "active"])
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as StabilityTaskRow | null) ?? null;
}

async function applyTemplateProgression(
  adminClient: ReturnType<typeof createClient>,
  templateId: string,
  effortsByExercise: Map<string, RpeLabel[]>,
  completedSets: WorkoutSetRow[],
): Promise<ProgressionRecommendation[]> {
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

    const { data: previousSession, error: previousSessionError } = await adminClient
      .from("workout_sessions")
      .select("completed_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .neq("id", sessionId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousSessionError) {
      throw previousSessionError;
    }

    const { data: existingState, error: stateError } = await adminClient
      .from("game_state")
      .select("power_balance, entropy, current_debuff_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (stateError) {
      throw stateError;
    }

    const openStabilityTask = await fetchOpenStabilityTask(adminClient, user.id);
    const totalVolume = calculateTotalVolume(completedSets);
    const workingSetCount = completedSets.filter((set) => set.set_type === "working").length;
    const { powerAwarded: basePowerAwarded } = calculatePowerFromWorkout({
      totalVolume,
      totalWorkingSets: workingSetCount,
    });
    const powerModifier = applyPowerGainModifier({
      basePower: basePowerAwarded,
      debuffEffectValue: Number(openStabilityTask?.effect_value ?? 0.15),
      hasActivePowerGainDebuff: openStabilityTask?.status === "active",
    });
    const powerAwarded = powerModifier.powerAwarded;
    const completedAt = new Date().toISOString();
    const daysSinceLastWorkout = daysBetween(previousSession?.completed_at, completedAt);
    const currentEntropy = Number((existingState as GameStateRow | null)?.entropy ?? 0);
    const missedWorkEntropy = calculateEntropyFromMissedWork(currentEntropy, {
      daysSinceLastWorkout,
    });
    const staleExerciseCount = await countStaleExerciseSignals(
      adminClient,
      user.id,
      collectWorkingExerciseIds(completedSets),
    );
    const workoutEntropy = calculateEntropyAfterWorkout(missedWorkEntropy.nextEntropy, {
      hasNearDeathEffort: completedSets.some(
        (set) =>
          set.is_completed &&
          set.set_type === "working" &&
          set.rpe_label === "near_death",
      ),
      staleExerciseCount,
    });
    const entropyDelta = missedWorkEntropy.delta + workoutEntropy.delta;
    const nextEntropy = workoutEntropy.nextEntropy;
    const entropyReasons = [...missedWorkEntropy.reasons, ...workoutEntropy.reasons];

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

    let progressionUpdates: ProgressionRecommendation[] = [];
    if (session.template_id) {
      const effortsByExercise = collectEffortsByExercise(completedSets);
      progressionUpdates = await applyTemplateProgression(
        adminClient,
        session.template_id,
        effortsByExercise,
        completedSets,
      );
    }

    const { error: workoutEventError } = await adminClient.from("game_events").insert({
      user_id: user.id,
      event_type: "workout_completed",
      source_type: "workout_session",
      source_id: sessionId,
      power_delta: powerAwarded,
      entropy_delta: entropyDelta,
      metadata: {
        clientMutationId,
        totalVolume,
        basePowerAwarded,
        powerModifierApplied: powerModifier.modifierApplied,
        entropyReasons,
        daysSinceLastWorkout,
        staleExerciseCount,
        progressionUpdates,
      },
    });

    if (workoutEventError) {
      throw workoutEventError;
    }

    const nextPowerBalance =
      Number((existingState as GameStateRow | null)?.power_balance ?? 0) + powerAwarded;

    if (existingState) {
      const { error: updateStateError } = await adminClient
        .from("game_state")
        .update({
          power_balance: nextPowerBalance,
          entropy: nextEntropy,
          current_debuff_id:
            openStabilityTask?.id ??
            (existingState as GameStateRow).current_debuff_id ??
            null,
          status: openStabilityTask ? "debuffed" : (existingState as GameStateRow).status,
        })
        .eq("user_id", user.id);

      if (updateStateError) {
        throw updateStateError;
      }
    } else {
      const { error: insertStateError } = await adminClient.from("game_state").insert({
        user_id: user.id,
        power_balance: powerAwarded,
        entropy: nextEntropy,
        current_debuff_id: openStabilityTask?.id ?? null,
        status: openStabilityTask ? "debuffed" : "active",
      });

      if (insertStateError) {
        throw insertStateError;
      }
    }

    let assignedStabilityTaskId: string | null = null;
    const taskEvaluation = evaluateStabilityTaskAssignment({
      entropy: nextEntropy,
      hasActiveStabilityTask: Boolean(openStabilityTask),
    });

    if (taskEvaluation.shouldAssign) {
      const { data: assignedTask, error: assignedTaskError } = await adminClient
        .from("debuffs")
        .insert({
          user_id: user.id,
          debuff_type: taskEvaluation.debuffType,
          status: "pending_reveal",
          source_session_id: sessionId,
          metadata: {
            label: "Stability Task",
            source: "Entropy Spike",
            entropyAtAssignment: nextEntropy,
            entropyReasons,
          },
        })
        .select("id")
        .single();

      if (assignedTaskError && assignedTaskError.code !== "23505") {
        throw assignedTaskError;
      }

      if (assignedTask) {
        assignedStabilityTaskId = assignedTask.id;

        const { error: updateAssignedStateError } = await adminClient
          .from("game_state")
          .update({
            current_debuff_id: assignedStabilityTaskId,
            status: "debuffed",
          })
          .eq("user_id", user.id);

        if (updateAssignedStateError) {
          throw updateAssignedStateError;
        }

        const { error: assignedEventError } = await adminClient.from("game_events").insert({
          user_id: user.id,
          event_type: "debuff_assigned",
          source_type: "debuff",
          source_id: assignedStabilityTaskId,
          metadata: {
            label: "Stability Task",
            source: "Entropy Spike",
            entropyAtAssignment: nextEntropy,
            sourceSessionId: sessionId,
          },
        });

        if (assignedEventError) {
          throw assignedEventError;
        }
      }
    }

    return new Response(
      JSON.stringify({
        sessionId,
        totalVolume,
        powerAwarded,
        entropy: nextEntropy,
        entropyDelta,
        entropyReasons,
        stabilityTaskAssigned: Boolean(assignedStabilityTaskId),
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
