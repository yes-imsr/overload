export const EFFORT_OPTIONS = ["Easy", "Medium", "Hard", "Near Death"] as const;

export type Effort = (typeof EFFORT_OPTIONS)[number];

export type WeightUnit = "lb" | "kg";

export type WorkoutSetType = "warmup" | "working" | "punishment" | "backoff";

export interface WorkoutSet {
  readonly exerciseId: string;
  readonly setOrder: number;
  readonly setType: WorkoutSetType;
  readonly weight: number;
  readonly weightUnit: WeightUnit;
  readonly reps: number;
  readonly effort: Effort;
}

export interface ExerciseResult {
  readonly exerciseId: string;
  readonly sets: readonly WorkoutSet[];
  readonly totalVolume: number;
  readonly bestEstimatedOneRepMax: number;
  readonly hardestEffort: Effort;
}

export interface WorkoutSessionSummary {
  readonly sessionId: string;
  readonly completedAtIso: string;
  readonly exerciseResults: readonly ExerciseResult[];
  readonly totalSets: number;
  readonly totalVolume: number;
}
