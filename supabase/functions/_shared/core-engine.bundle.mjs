// packages/core-engine/src/economy/constants.ts
var POWER_VOLUME_DIVISOR = 62.5;
var MIN_POWER_AWARD = 1;
var DEFAULT_POWER_GAIN_DEBUFF_EFFECT = 0.15;
var MS_PER_HOUR = 60 * 60 * 1e3;
var MAX_IDLE_ACCRUAL_HOURS = 24 * 7;

// packages/core-engine/src/economy/calculatePowerFromWorkout.ts
function roundPower(value) {
  return Math.round(value * 100) / 100;
}
function calculatePowerFromWorkout(input) {
  if (!Number.isFinite(input.totalVolume) || input.totalVolume < 0) {
    throw new RangeError("totalVolume must be a non-negative finite number");
  }
  if (!Number.isFinite(input.totalWorkingSets) || input.totalWorkingSets < 0) {
    throw new RangeError("totalWorkingSets must be a non-negative finite number");
  }
  if (input.totalWorkingSets === 0) {
    return { basePower: 0, powerAwarded: 0 };
  }
  const rawPower = input.totalVolume / POWER_VOLUME_DIVISOR;
  const basePower = roundPower(rawPower);
  const powerAwarded = roundPower(Math.max(MIN_POWER_AWARD, basePower));
  return { basePower, powerAwarded };
}

// packages/core-engine/src/debuffs/applyPowerGainModifier.ts
function roundPower2(value) {
  return Math.round(value * 100) / 100;
}
function applyPowerGainModifier(input) {
  if (!Number.isFinite(input.basePower) || input.basePower < 0) {
    throw new RangeError("basePower must be a non-negative finite number");
  }
  if (!input.hasActivePowerGainDebuff) {
    return { powerAwarded: roundPower2(input.basePower), modifierApplied: 1 };
  }
  const effectValue = input.debuffEffectValue ?? DEFAULT_POWER_GAIN_DEBUFF_EFFECT;
  if (!Number.isFinite(effectValue) || effectValue < 0 || effectValue >= 1) {
    throw new RangeError("debuffEffectValue must be between 0 (inclusive) and 1 (exclusive)");
  }
  const modifierApplied = 1 - effectValue;
  return {
    powerAwarded: roundPower2(input.basePower * modifierApplied),
    modifierApplied
  };
}

// packages/core-engine/src/entropy/constants.ts
var ENTROPY_STABILITY_TASK_THRESHOLD = 15;
var ENTROPY_MAX = 100;
var ENTROPY_MISS_WORKOUT_PER_DAY = 2;
var ENTROPY_MISS_WORKOUT_GRACE_DAYS = 2;
var ENTROPY_NEAR_DEATH_SESSION = 2;
var ENTROPY_STALE_EXERCISE_COUNT = 3;
var ENTROPY_STABILITY_TASK_RESOLUTION = 8;
var STABILITY_TASK_DEBUFF_TYPE = "power_gain_reduction";

// packages/core-engine/src/entropy/calculateEntropy.ts
function clampEntropy(value) {
  return Math.min(ENTROPY_MAX, Math.max(0, Math.round(value * 100) / 100));
}
function calculateEntropyAfterWorkout(currentEntropy, input) {
  if (!Number.isFinite(currentEntropy) || currentEntropy < 0) {
    throw new RangeError("currentEntropy must be a non-negative finite number");
  }
  if (!Number.isFinite(input.staleExerciseCount) || input.staleExerciseCount < 0) {
    throw new RangeError("staleExerciseCount must be a non-negative finite number");
  }
  const reasons = [];
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
function calculateEntropyFromMissedWork(currentEntropy, input) {
  if (!Number.isFinite(currentEntropy) || currentEntropy < 0) {
    throw new RangeError("currentEntropy must be a non-negative finite number");
  }
  if (!Number.isFinite(input.daysSinceLastWorkout) || input.daysSinceLastWorkout < 0) {
    throw new RangeError("daysSinceLastWorkout must be a non-negative finite number");
  }
  const missedDays = Math.max(
    0,
    input.daysSinceLastWorkout - ENTROPY_MISS_WORKOUT_GRACE_DAYS
  );
  const delta = missedDays * ENTROPY_MISS_WORKOUT_PER_DAY;
  const nextEntropy = clampEntropy(currentEntropy + delta);
  return {
    delta: nextEntropy - currentEntropy,
    nextEntropy,
    reasons: missedDays > 0 ? ["missed_workouts"] : []
  };
}
function evaluateStabilityTaskAssignment(input) {
  const shouldAssign = !input.hasActiveStabilityTask && input.entropy >= ENTROPY_STABILITY_TASK_THRESHOLD;
  return {
    shouldAssign,
    debuffType: STABILITY_TASK_DEBUFF_TYPE
  };
}
function resolveStabilityTask(input) {
  if (!Number.isFinite(input.currentEntropy) || input.currentEntropy < 0) {
    throw new RangeError("currentEntropy must be a non-negative finite number");
  }
  const entropyAfter = clampEntropy(input.currentEntropy - ENTROPY_STABILITY_TASK_RESOLUTION);
  return {
    entropyAfter,
    entropyDelta: entropyAfter - input.currentEntropy
  };
}

// packages/core-engine/src/progression/constants.ts
var WEIGHT_INCREASE_RATIO_EASY = 0.05;
var WEIGHT_INCREASE_RATIO_MEDIUM = 0.025;
var WEIGHT_DECREASE_RATIO_NEAR_DEATH = 0.025;
var REP_INCREASE_EASY = 2;
var REP_INCREASE_MEDIUM = 1;
var NEAR_DEATH_REP_CAP_REDUCTION = 2;

// packages/core-engine/src/progression/hardestEffort.ts
var EFFORT_RANK = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
  "Near Death": 3
};
function pickHardestEffort(efforts) {
  if (efforts.length === 0) {
    return null;
  }
  return efforts.reduce(
    (hardest, effort) => EFFORT_RANK[effort] > EFFORT_RANK[hardest] ? effort : hardest
  );
}
var RPE_TO_EFFORT = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  near_death: "Near Death"
};
function effortFromRpeLabel(label) {
  return RPE_TO_EFFORT[label];
}

// packages/core-engine/src/progression/recommendProgression.ts
function roundWeight(weight) {
  return Math.round(weight * 100) / 100;
}
function applyWeightDelta(weight, ratio) {
  return roundWeight(Math.max(0, weight * (1 + ratio)));
}
function recommendProgressionForExercise(target, hardestEffort) {
  const { exerciseId, currentWeight, currentRepTarget } = target;
  switch (hardestEffort) {
    case "Easy": {
      const increasedWeight = applyWeightDelta(currentWeight, WEIGHT_INCREASE_RATIO_EASY);
      if (currentWeight > 0 && increasedWeight > currentWeight) {
        return {
          exerciseId,
          action: "increase",
          nextWeight: increasedWeight,
          nextRepTarget: currentRepTarget,
          reasonCode: "effort_easy_weight_up"
        };
      }
      return {
        exerciseId,
        action: "increase",
        nextWeight: currentWeight,
        nextRepTarget: currentRepTarget + REP_INCREASE_EASY,
        reasonCode: "effort_easy_reps_up"
      };
    }
    case "Medium": {
      const increasedWeight = applyWeightDelta(currentWeight, WEIGHT_INCREASE_RATIO_MEDIUM);
      if (currentWeight > 0 && increasedWeight > currentWeight) {
        return {
          exerciseId,
          action: "increase",
          nextWeight: increasedWeight,
          nextRepTarget: currentRepTarget,
          reasonCode: "effort_medium_weight_up"
        };
      }
      return {
        exerciseId,
        action: "increase",
        nextWeight: currentWeight,
        nextRepTarget: currentRepTarget + REP_INCREASE_MEDIUM,
        reasonCode: "effort_medium_reps_up"
      };
    }
    case "Hard":
      return {
        exerciseId,
        action: "hold",
        nextWeight: currentWeight,
        nextRepTarget: currentRepTarget,
        reasonCode: "effort_hard_hold"
      };
    case "Near Death": {
      const reducedWeight = applyWeightDelta(currentWeight, -WEIGHT_DECREASE_RATIO_NEAR_DEATH);
      if (currentWeight > 0 && reducedWeight < currentWeight) {
        return {
          exerciseId,
          action: "reduce",
          nextWeight: reducedWeight,
          nextRepTarget: currentRepTarget,
          reasonCode: "effort_near_death_weight_down"
        };
      }
      return {
        exerciseId,
        action: "cap_reps",
        nextWeight: currentWeight,
        nextRepTarget: Math.max(1, currentRepTarget - NEAR_DEATH_REP_CAP_REDUCTION),
        reasonCode: "effort_near_death_rep_cap"
      };
    }
    default: {
      const exhaustive = hardestEffort;
      return exhaustive;
    }
  }
}

// packages/core-engine/src/progression/recommendSessionProgression.ts
function recommendProgressionForSession(targets, sessionEfforts) {
  const effortByExercise = new Map(
    sessionEfforts.map((entry) => [entry.exerciseId, pickHardestEffort(entry.efforts)])
  );
  return targets.flatMap((target) => {
    const hardestEffort = effortByExercise.get(target.exerciseId);
    if (!hardestEffort) {
      return [];
    }
    return [recommendProgressionForExercise(target, hardestEffort)];
  });
}
export {
  applyPowerGainModifier,
  calculateEntropyAfterWorkout,
  calculateEntropyFromMissedWork,
  calculatePowerFromWorkout,
  effortFromRpeLabel,
  evaluateStabilityTaskAssignment,
  recommendProgressionForSession,
  resolveStabilityTask
};
