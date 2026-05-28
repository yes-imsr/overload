import { pickHardestEffort } from "./hardestEffort";
import { recommendProgressionForExercise } from "./recommendProgression";
import type { ProgressionRecommendation, ProgressionTarget } from "./types";
import type { Effort } from "../workouts/types";

export interface ExerciseSessionEffort {
  readonly exerciseId: string;
  readonly efforts: readonly Effort[];
}

export function recommendProgressionForSession(
  targets: readonly ProgressionTarget[],
  sessionEfforts: readonly ExerciseSessionEffort[],
): readonly ProgressionRecommendation[] {
  const effortByExercise = new Map(
    sessionEfforts.map((entry) => [entry.exerciseId, pickHardestEffort(entry.efforts)]),
  );

  return targets.flatMap((target) => {
    const hardestEffort = effortByExercise.get(target.exerciseId);
    if (!hardestEffort) {
      return [];
    }

    return [recommendProgressionForExercise(target, hardestEffort)];
  });
}
