import { ENTROPY_PRESTIGE_MAX } from "../entropy/constants";
import {
  PRESTIGE_E1RM_IMPROVEMENT_RATIO,
  PRESTIGE_FAILURE_CREDIT_PENALTY,
  PRESTIGE_FAILURE_LOCKOUT_HOURS,
  PRESTIGE_MIN_CALIBRATED_EXERCISES,
  PRESTIGE_REQUIRED_CREDITS,
} from "./constants";
import type {
  PrestigeAttemptResult,
  PrestigeAttemptResultInput,
  PrestigeEligibilityInput,
  PrestigeEligibilityResult,
  PrestigeTargetInput,
  PrestigeTargetSnapshot,
} from "./types";

function isLockoutActive(lockoutUntilIso: string | null, nowIso: string): boolean {
  if (!lockoutUntilIso) {
    return false;
  }
  return Date.parse(lockoutUntilIso) > Date.parse(nowIso);
}

export function evaluatePrestigeEligibility(
  input: PrestigeEligibilityInput,
): PrestigeEligibilityResult {
  const blockers: string[] = [];

  if (input.hasActiveAttempt) {
    blockers.push("active_attempt");
  }
  if (isLockoutActive(input.lockoutUntilIso, input.nowIso)) {
    blockers.push("lockout_active");
  }
  if (input.creditsBalance < PRESTIGE_REQUIRED_CREDITS) {
    blockers.push("insufficient_credits");
  }
  if (input.entropy > ENTROPY_PRESTIGE_MAX) {
    blockers.push("entropy_too_high");
  }
  if (input.calibratedExerciseCount < PRESTIGE_MIN_CALIBRATED_EXERCISES) {
    blockers.push("insufficient_calibration");
  }

  return {
    eligible: blockers.length === 0,
    blockers,
  };
}

export function buildPrestigeTarget(input: PrestigeTargetInput): PrestigeTargetSnapshot {
  if (!input.exerciseId) {
    throw new RangeError("exerciseId is required");
  }

  if (input.metric === "estimated_1rm") {
    if (!Number.isFinite(input.bestEstimatedOneRepMax) || input.bestEstimatedOneRepMax <= 0) {
      throw new RangeError("bestEstimatedOneRepMax must be a positive finite number");
    }
    return {
      exerciseId: input.exerciseId,
      metric: input.metric,
      targetValue:
        Math.round(input.bestEstimatedOneRepMax * PRESTIGE_E1RM_IMPROVEMENT_RATIO * 100) / 100,
      requiredCredits: PRESTIGE_REQUIRED_CREDITS,
    };
  }

  if (!Number.isFinite(input.bestRepRecord) || input.bestRepRecord <= 0) {
    throw new RangeError("bestRepRecord must be a positive finite number");
  }

  return {
    exerciseId: input.exerciseId,
    metric: input.metric,
    targetValue: input.bestRepRecord + 1,
    requiredCredits: PRESTIGE_REQUIRED_CREDITS,
  };
}

export function evaluatePrestigeAttempt(
  input: PrestigeAttemptResultInput,
  currentPrestigeLevel: number,
): PrestigeAttemptResult {
  const achievedValue =
    input.target.metric === "estimated_1rm"
      ? input.achievedEstimatedOneRepMax
      : input.achievedRepRecord;

  const succeeded = achievedValue >= input.target.targetValue;

  return {
    succeeded,
    achievedValue,
    creditPenalty: succeeded ? 0 : PRESTIGE_FAILURE_CREDIT_PENALTY,
    lockoutHours: succeeded ? 0 : PRESTIGE_FAILURE_LOCKOUT_HOURS,
    nextPrestigeLevel: succeeded ? currentPrestigeLevel + 1 : currentPrestigeLevel,
  };
}
