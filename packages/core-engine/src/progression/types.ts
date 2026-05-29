import type { Effort } from "../workouts/types";

export const PROGRESSION_ACTIONS = ["increase", "hold", "reduce", "cap_reps"] as const;

export type ProgressionAction = (typeof PROGRESSION_ACTIONS)[number];

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

export interface CompletedProgressionSet {
  readonly weight: number;
  readonly reps: number;
  readonly effort: Effort;
}

export interface ExerciseProgressionInput {
  readonly exerciseId: string;
  readonly currentWeight: number | null;
  readonly currentRepTarget: number;
  readonly completedSets: readonly CompletedProgressionSet[];
}

export interface SessionStruggleRecord {
  readonly sessionId: string;
  readonly hardestEffort: Effort;
  readonly metTargets: boolean;
}
