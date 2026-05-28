import type { CalibrationStatus } from "../calibration/types";

export interface EntropyWorkoutInput {
  readonly hasNearDeathEffort: boolean;
  readonly staleExerciseCount: number;
}

export interface EntropyMissedWorkInput {
  readonly daysSinceLastWorkout: number;
}

export interface EntropyDeltaResult {
  readonly delta: number;
  readonly nextEntropy: number;
  readonly reasons: readonly string[];
}

export interface StabilityTaskEvaluationInput {
  readonly entropy: number;
  readonly hasActiveStabilityTask: boolean;
}

export interface StabilityTaskEvaluationResult {
  readonly shouldAssign: boolean;
  readonly debuffType: "power_gain_reduction";
}

export interface StabilityTaskResolutionInput {
  readonly currentEntropy: number;
}

export interface StabilityTaskResolutionResult {
  readonly entropyAfter: number;
  readonly entropyDelta: number;
}

export interface ExerciseCalibrationSnapshot {
  readonly exerciseId: string;
  readonly status: CalibrationStatus;
}
