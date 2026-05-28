export const CALIBRATION_STATES = [
  "uncalibrated",
  "provisional",
  "calibrated",
  "stale",
] as const;

export type CalibrationState = (typeof CALIBRATION_STATES)[number];

export const CALIBRATION_UI_LABELS = {
  uncalibrated: "Learning",
  provisional: "Calibrating",
  calibrated: "Stable",
  stale: "Stale",
} as const satisfies Record<CalibrationState, string>;

export type CalibrationUiLabel =
  (typeof CALIBRATION_UI_LABELS)[CalibrationState];

export interface CalibrationObservation {
  readonly completedAtIso: string;
  readonly estimatedOneRepMax: number;
}

export interface CalibrationRules {
  readonly consistencyToleranceRatio: number;
  readonly consistencyWindow: number;
  readonly minimumConsistentPerformances: number;
  readonly staleAfterDays: number;
}

export type CalibrationTransitionReason =
  | "no_change"
  | "first_session"
  | "consistent_performances"
  | "insufficient_consistency"
  | "stale_break"
  | "reset";

export interface CalibrationTransitionInput {
  readonly currentState: CalibrationState;
  readonly observations?: readonly CalibrationObservation[];
  readonly newObservation?: CalibrationObservation;
  readonly calibratedAtIso?: string;
  readonly asOfIso?: string;
  readonly resetRequested?: boolean;
  readonly rules?: Partial<CalibrationRules>;
}

export interface CalibrationTransitionResult {
  readonly previousState: CalibrationState;
  readonly state: CalibrationState;
  readonly uiLabel: CalibrationUiLabel;
  readonly reason: CalibrationTransitionReason;
  readonly observations: readonly CalibrationObservation[];
  readonly calibratedAtIso?: string;
  readonly updatedAtIso?: string;
}
