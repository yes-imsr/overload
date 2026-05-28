export const CALIBRATION_STATUSES = [
  "uncalibrated",
  "provisional",
  "calibrated",
  "stale",
] as const;

export type CalibrationStatus = (typeof CALIBRATION_STATUSES)[number];

export const CALIBRATION_UI_LABELS = [
  "Learning",
  "Calibrating",
  "Stable",
  "Stale",
] as const;

export type CalibrationUiLabel = (typeof CALIBRATION_UI_LABELS)[number];

export type CalibrationUiState = "learning" | "calibrating" | "stable" | "stale";

export type CalibrationResetReason = "long_break" | "manual_reset" | "prestige";

export interface CalibrationPerformanceRecord {
  readonly sessionId: string;
  readonly completedAtIso: string;
  readonly bestEstimatedOneRepMax: number;
}

export interface ExerciseCalibrationContext {
  readonly status: CalibrationStatus;
  readonly calibratedAtIso: string | null;
  readonly recentPerformances: readonly CalibrationPerformanceRecord[];
}

export interface CalibrationSessionInput {
  readonly sessionId: string;
  readonly completedAtIso: string;
  readonly bestEstimatedOneRepMax: number;
  readonly completedWorkingSets: number;
}
