/**
 * Edge adapter: maps DB RPE labels to core-engine session effort inputs.
 * Progression math lives only in @overload/core-engine.
 */
import {
  effortFromRpeLabel,
  recommendProgressionForSession,
} from "./core-engine.bundle.mjs";
import type { RpeLabel } from "./core-engine.bundle.mjs";
import type {
  ProgressionRecommendation,
  ProgressionTarget,
} from "./core-engine.bundle.mjs";

export type { ProgressionRecommendation, ProgressionTarget, RpeLabel };

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
