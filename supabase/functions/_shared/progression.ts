/**
 * Edge adapter: maps DB RPE labels to core-engine session effort inputs.
 * Progression math lives only in @overload/core-engine.
 */
import {
  effortFromRpeLabel,
  recommendProgressionForSession,
} from "@overload/core-engine/progression/index.ts";
import type { RpeLabel } from "@overload/core-engine/progression/hardestEffort.ts";
import type {
  ProgressionRecommendation,
  ProgressionTarget,
} from "@overload/core-engine/progression/types.ts";

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
