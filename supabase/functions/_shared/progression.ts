// Mirrors @overload/core-engine progression helpers for Edge Functions.

type Effort = "Easy" | "Medium" | "Hard" | "Near Death";
type RpeLabel = "easy" | "medium" | "hard" | "near_death";
type ProgressionAction = "increase" | "hold" | "reduce" | "cap_reps";

export type ProgressionTarget = {
  exerciseId: string;
  currentWeight: number;
  currentRepTarget: number;
};

export type ProgressionRecommendation = {
  exerciseId: string;
  action: ProgressionAction;
  nextWeight: number;
  nextRepTarget: number;
  reasonCode: string;
};

const EFFORT_RANK: Record<Effort, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
  "Near Death": 3,
};

const RPE_TO_EFFORT: Record<RpeLabel, Effort> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  near_death: "Near Death",
};

const WEIGHT_INCREASE_RATIO_EASY = 0.05;
const WEIGHT_INCREASE_RATIO_MEDIUM = 0.025;
const WEIGHT_DECREASE_RATIO_NEAR_DEATH = 0.025;
const REP_INCREASE_EASY = 2;
const REP_INCREASE_MEDIUM = 1;
const NEAR_DEATH_REP_CAP_REDUCTION = 2;

function roundWeight(weight: number): number {
  return Math.round(weight * 100) / 100;
}

function applyWeightDelta(weight: number, ratio: number): number {
  return roundWeight(Math.max(0, weight * (1 + ratio)));
}

function pickHardestEffort(efforts: Effort[]): Effort | null {
  if (efforts.length === 0) {
    return null;
  }
  return efforts.reduce((hardest, effort) =>
    EFFORT_RANK[effort] > EFFORT_RANK[hardest] ? effort : hardest,
  );
}

function recommendProgressionForExercise(
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
    default:
      return hardestEffort satisfies never;
  }
}

export function recommendProgressionForSession(
  targets: ProgressionTarget[],
  effortsByExercise: Map<string, RpeLabel[]>,
): ProgressionRecommendation[] {
  const recommendations: ProgressionRecommendation[] = [];

  for (const target of targets) {
    const labels = effortsByExercise.get(target.exerciseId) ?? [];
    const rpeEfforts = labels.map((label) => RPE_TO_EFFORT[label]);
    const hardest = pickHardestEffort(rpeEfforts);
    if (!hardest) {
      continue;
    }
    recommendations.push(recommendProgressionForExercise(target, hardest));
  }

  return recommendations;
}
