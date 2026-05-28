import type { CalibrationStatus } from "../calibration/types";

export type PrestigeTargetMetric = "estimated_1rm" | "rep_pr";

export interface PrestigeEligibilityInput {
  readonly creditsBalance: number;
  readonly entropy: number;
  readonly prestigeLevel: number;
  readonly hasActiveAttempt: boolean;
  readonly lockoutUntilIso: string | null;
  readonly nowIso: string;
  readonly calibratedExerciseCount: number;
}

export interface PrestigeEligibilityResult {
  readonly eligible: boolean;
  readonly blockers: readonly string[];
}

export interface PrestigeTargetInput {
  readonly exerciseId: string;
  readonly metric: PrestigeTargetMetric;
  readonly bestEstimatedOneRepMax: number;
  readonly bestRepRecord: number;
}

export interface PrestigeTargetSnapshot {
  readonly exerciseId: string;
  readonly metric: PrestigeTargetMetric;
  readonly targetValue: number;
  readonly requiredCredits: number;
}

export interface PrestigeAttemptResultInput {
  readonly target: PrestigeTargetSnapshot;
  readonly achievedEstimatedOneRepMax: number;
  readonly achievedRepRecord: number;
}

export interface PrestigeAttemptResult {
  readonly succeeded: boolean;
  readonly achievedValue: number;
  readonly creditPenalty: number;
  readonly lockoutHours: number;
  readonly nextPrestigeLevel: number;
}

export interface CalibratedExerciseSnapshot {
  readonly exerciseId: string;
  readonly status: CalibrationStatus;
}
