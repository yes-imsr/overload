/**
 * Edge adapter: maps DB RPE labels to core-engine session effort inputs.
 * Progression math lives only in @overload/core-engine.
 */
import {
  effortFromRpeLabel,
  recommendProgressionForSession,
} from "./core-engine.bundle.mjs";

export type RpeLabel = "easy" | "medium" | "hard" | "near_death";
export type ProgressionAction = "increase" | "hold" | "reduce" | "cap_reps";

export interface ProgressionTarget {
  readonly exerciseId: string;
  readonly currentWeight: number;
  readonly currentRepTarget: number;
}

export interface ProgressionRecommendation {
  readonly exerciseId: string;
  readonly action: ProgressionAction;
  readonly nextWeight: number;
  readonly nextRepTarget: number;
  readonly reasonCode: string;
}

export function recommendProgressionForSessionFromRpe(
  targets: readonly ProgressionTarget[],
  effortsByExercise: Map<string, RpeLabel[]>,
): readonly ProgressionRecommendation[] {
  const sessionEfforts = [...effortsByExercise.entries()].map(([exerciseId, labels]) => ({
    exerciseId,
    efforts: labels.map(effortFromRpeLabel),
  }));

  return recommendProgressionForSession(targets, sessionEfforts);
}
