import type { Effort } from "../workouts/types";

const EFFORT_RANK: Record<Effort, number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
  "Near Death": 3,
};

export function pickHardestEffort(efforts: readonly Effort[]): Effort | null {
  if (efforts.length === 0) {
    return null;
  }

  return efforts.reduce((hardest, effort) =>
    EFFORT_RANK[effort] > EFFORT_RANK[hardest] ? effort : hardest,
  );
}

export type RpeLabel = "easy" | "medium" | "hard" | "near_death";

const RPE_TO_EFFORT: Record<RpeLabel, Effort> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  near_death: "Near Death",
};

export function effortFromRpeLabel(label: RpeLabel): Effort {
  return RPE_TO_EFFORT[label];
}

export function pickHardestEffortFromRpeLabels(labels: readonly RpeLabel[]): Effort | null {
  const efforts = labels.map(effortFromRpeLabel);
  return pickHardestEffort(efforts);
}
