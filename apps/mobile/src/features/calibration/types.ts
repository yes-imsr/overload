import type { CalibrationStatus } from "@overload/core-engine";

export type ExerciseCalibrationRow = {
  id: string;
  user_id: string;
  exercise_id: string;
  calibration_status: CalibrationStatus;
  calibrated_at: string | null;
  last_session_at: string | null;
  exercise: {
    id: string;
    name: string;
  };
};
