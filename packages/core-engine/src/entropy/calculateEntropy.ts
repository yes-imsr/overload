import {
  ENTROPY_MAX,
  ENTROPY_MISS_WORKOUT_GRACE_DAYS,
  ENTROPY_MISS_WORKOUT_PER_DAY,
  ENTROPY_NEAR_DEATH_SESSION,
  ENTROPY_STABILITY_TASK_RESOLUTION,
  ENTROPY_STABILITY_TASK_THRESHOLD,
  ENTROPY_STALE_EXERCISE_COUNT,
  STABILITY_TASK_DEBUFF_TYPE,
} from "./constants";
import type {
  EntropyDeltaResult,
  EntropyMissedWorkInput,
  EntropyWorkoutInput,
  StabilityTaskEvaluationInput,
  StabilityTaskEvaluationResult,
  StabilityTaskResolutionInput,
  StabilityTaskResolutionResult,
} from "./types";

function clampEntropy(value: number): number {
  return Math.min(ENTROPY_MAX, Math.max(0, Math.round(value * 100) / 100));
}

export function calculateEntropyAfterWorkout(
  currentEntropy: number,
  input: EntropyWorkoutInput,
): EntropyDeltaResult {
  if (!Number.isFinite(currentEntropy) || currentEntropy < 0) {
    throw new RangeError("currentEntropy must be a non-negative finite number");
  }
  if (!Number.isFinite(input.staleExerciseCount) || input.staleExerciseCount < 0) {
    throw new RangeError("staleExerciseCount must be a non-negative finite number");
  }

  const reasons: string[] = [];
  let delta = 0;

  if (input.hasNearDeathEffort) {
    delta += ENTROPY_NEAR_DEATH_SESSION;
    reasons.push("near_death_effort");
  }

  if (input.staleExerciseCount > 0) {
    delta += ENTROPY_STALE_EXERCISE_COUNT * input.staleExerciseCount;
    reasons.push("stale_exercises");
  }

  const nextEntropy = clampEntropy(currentEntropy + delta);
  return { delta: nextEntropy - currentEntropy, nextEntropy, reasons };
}

export function calculateEntropyFromMissedWork(
  currentEntropy: number,
  input: EntropyMissedWorkInput,
): EntropyDeltaResult {
  if (!Number.isFinite(currentEntropy) || currentEntropy < 0) {
    throw new RangeError("currentEntropy must be a non-negative finite number");
  }
  if (!Number.isFinite(input.daysSinceLastWorkout) || input.daysSinceLastWorkout < 0) {
    throw new RangeError("daysSinceLastWorkout must be a non-negative finite number");
  }

  const missedDays = Math.max(
    0,
    input.daysSinceLastWorkout - ENTROPY_MISS_WORKOUT_GRACE_DAYS,
  );
  const delta = missedDays * ENTROPY_MISS_WORKOUT_PER_DAY;
  const nextEntropy = clampEntropy(currentEntropy + delta);

  return {
    delta: nextEntropy - currentEntropy,
    nextEntropy,
    reasons: missedDays > 0 ? ["missed_workouts"] : [],
  };
}

export function evaluateStabilityTaskAssignment(
  input: StabilityTaskEvaluationInput,
): StabilityTaskEvaluationResult {
  const shouldAssign =
    !input.hasActiveStabilityTask && input.entropy >= ENTROPY_STABILITY_TASK_THRESHOLD;

  return {
    shouldAssign,
    debuffType: STABILITY_TASK_DEBUFF_TYPE,
  };
}

export function resolveStabilityTask(
  input: StabilityTaskResolutionInput,
): StabilityTaskResolutionResult {
  if (!Number.isFinite(input.currentEntropy) || input.currentEntropy < 0) {
    throw new RangeError("currentEntropy must be a non-negative finite number");
  }

  const entropyAfter = clampEntropy(input.currentEntropy - ENTROPY_STABILITY_TASK_RESOLUTION);
  return {
    entropyAfter,
    entropyDelta: entropyAfter - input.currentEntropy,
  };
}
