import {
  NEAR_DEATH_REP_CAP_REDUCTION,
  REP_INCREASE_EASY,
  REP_INCREASE_MEDIUM,
  WEIGHT_DECREASE_RATIO_NEAR_DEATH,
  WEIGHT_INCREASE_RATIO_EASY,
  WEIGHT_INCREASE_RATIO_MEDIUM,
} from "./constants";
import type { ProgressionRecommendation, ProgressionTarget } from "./types";
import type { Effort } from "../workouts/types";

function roundWeight(weight: number): number {
  return Math.round(weight * 100) / 100;
}

function applyWeightDelta(weight: number, ratio: number): number {
  return roundWeight(Math.max(0, weight * (1 + ratio)));
}

export function recommendProgressionForExercise(
  target: ProgressionTarget,
  hardestEffort: Effort,
): ProgressionRecommendation {
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
          reasonCode: "effort_easy_weight_up",
        };
      }
      return {
        exerciseId,
        action: "increase",
        nextWeight: currentWeight,
        nextRepTarget: currentRepTarget + REP_INCREASE_EASY,
        reasonCode: "effort_easy_reps_up",
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
          reasonCode: "effort_medium_weight_up",
        };
      }
      return {
        exerciseId,
        action: "increase",
        nextWeight: currentWeight,
        nextRepTarget: currentRepTarget + REP_INCREASE_MEDIUM,
        reasonCode: "effort_medium_reps_up",
      };
    }
    case "Hard":
      return {
        exerciseId,
        action: "hold",
        nextWeight: currentWeight,
        nextRepTarget: currentRepTarget,
        reasonCode: "effort_hard_hold",
      };
    case "Near Death": {
      const reducedWeight = applyWeightDelta(currentWeight, -WEIGHT_DECREASE_RATIO_NEAR_DEATH);
      if (currentWeight > 0 && reducedWeight < currentWeight) {
        return {
          exerciseId,
          action: "reduce",
          nextWeight: reducedWeight,
          nextRepTarget: currentRepTarget,
          reasonCode: "effort_near_death_weight_down",
        };
      }
      return {
        exerciseId,
        action: "cap_reps",
        nextWeight: currentWeight,
        nextRepTarget: Math.max(1, currentRepTarget - NEAR_DEATH_REP_CAP_REDUCTION),
        reasonCode: "effort_near_death_rep_cap",
      };
    }
    default: {
      const exhaustive: never = hardestEffort;
      return exhaustive;
    }
  }
}
