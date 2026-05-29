/** Edge-local mirrors of @overload/core-engine progression types (Deno cannot import types from the JS bundle). */

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
