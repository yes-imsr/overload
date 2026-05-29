import { recommendProgressionForExercise } from "./recommendProgression";
import type {
  CompletedProgressionSet,
  ExerciseProgressionInput,
  ProgressionRecommendation,
} from "./types";
import type { Effort } from "../workouts/types";

const EFFORT_RANK: Record<Effort, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
  "Near Death": 4,
};

function assertFiniteNonNegative(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${fieldName} must be a finite non-negative number`);
  }
}

function resolveWeightTarget(
  currentWeight: number | null,
  completedSets: readonly CompletedProgressionSet[],
): number {
  if (currentWeight !== null) {
    assertFiniteNonNegative(currentWeight, "currentWeight");
    if (currentWeight > 0) {
      return currentWeight;
    }
  }

  return completedSets.reduce((heaviest, set) => {
    assertFiniteNonNegative(set.weight, "set.weight");
    return Math.max(heaviest, set.weight);
  }, 0);
}

export function getHardestEffort(efforts: readonly Effort[]): Effort {
  if (efforts.length === 0) {
    throw new RangeError("At least one effort is required");
  }

  return efforts.reduce((hardest, effort) =>
    EFFORT_RANK[effort] > EFFORT_RANK[hardest] ? effort : hardest,
  );
}

export function recommendProgressionsForSession(
  exercises: readonly ExerciseProgressionInput[],
): ProgressionRecommendation[] {
  return exercises.map((exercise) => {
    if (!Number.isInteger(exercise.currentRepTarget) || exercise.currentRepTarget < 1) {
      throw new RangeError("currentRepTarget must be a positive integer");
    }

    if (exercise.completedSets.length === 0) {
      throw new RangeError("At least one completed set is required");
    }

    const currentWeight = resolveWeightTarget(exercise.currentWeight, exercise.completedSets);
    const hardestEffort = getHardestEffort(exercise.completedSets.map((set) => set.effort));

    return recommendProgressionForExercise(
      {
        exerciseId: exercise.exerciseId,
        currentWeight,
        currentRepTarget: exercise.currentRepTarget,
      },
      hardestEffort,
    );
  });
}
