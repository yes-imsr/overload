type CalibrationStatus = "uncalibrated" | "provisional" | "calibrated" | "stale";

type CalibrationPerformanceRecord = {
  sessionId: string;
  completedAtIso: string;
  bestEstimatedOneRepMax: number;
};

type ExerciseCalibrationContext = {
  status: CalibrationStatus;
  calibratedAtIso: string | null;
  recentPerformances: CalibrationPerformanceRecord[];
};

type CalibrationSessionInput = {
  sessionId: string;
  completedAtIso: string;
  bestEstimatedOneRepMax: number;
  completedWorkingSets: number;
};

const MIN_WORKING_SETS_FOR_CALIBRATION = 1;
const SESSIONS_TO_PROVISIONAL = 1;
const CONSISTENT_SESSIONS_TO_CALIBRATED = 2;
const CONSISTENT_E1RM_TOLERANCE_RATIO = 0.08;

export function createInitialCalibrationContext(): ExerciseCalibrationContext {
  return {
    status: "uncalibrated",
    calibratedAtIso: null,
    recentPerformances: [],
  };
}

export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) {
    return weight;
  }
  return weight * (1 + reps / 30);
}

function appendPerformance(
  performances: CalibrationPerformanceRecord[],
  record: CalibrationPerformanceRecord,
): CalibrationPerformanceRecord[] {
  const withoutDuplicate = performances.filter((entry) => entry.sessionId !== record.sessionId);
  return [...withoutDuplicate, record].slice(-CONSISTENT_SESSIONS_TO_CALIBRATED);
}

function performancesAreConsistent(performances: CalibrationPerformanceRecord[]): boolean {
  if (performances.length < CONSISTENT_SESSIONS_TO_CALIBRATED) {
    return false;
  }

  const values = performances.map((entry) => entry.bestEstimatedOneRepMax);
  const sorted = [...values].sort((a, b) => a - b);
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2
      : sorted[Math.floor(sorted.length / 2)]!;

  if (median <= 0) {
    return false;
  }

  return values.every(
    (value) => Math.abs(value - median) / median <= CONSISTENT_E1RM_TOLERANCE_RATIO,
  );
}

function deriveStatusAfterPerformances(
  performances: CalibrationPerformanceRecord[],
  previousStatus: CalibrationStatus,
): CalibrationStatus {
  if (performances.length < SESSIONS_TO_PROVISIONAL) {
    return previousStatus === "stale" ? "stale" : "uncalibrated";
  }

  if (performancesAreConsistent(performances)) {
    return "calibrated";
  }

  if (performances.length >= SESSIONS_TO_PROVISIONAL) {
    return "provisional";
  }

  return "uncalibrated";
}

export function applyCompletedCalibrationSession(
  context: ExerciseCalibrationContext,
  session: CalibrationSessionInput,
): ExerciseCalibrationContext {
  if (
    session.completedWorkingSets < MIN_WORKING_SETS_FOR_CALIBRATION ||
    !Number.isFinite(session.bestEstimatedOneRepMax) ||
    session.bestEstimatedOneRepMax <= 0
  ) {
    return context;
  }

  const record: CalibrationPerformanceRecord = {
    sessionId: session.sessionId,
    completedAtIso: session.completedAtIso,
    bestEstimatedOneRepMax: session.bestEstimatedOneRepMax,
  };
  const performances = appendPerformance(context.recentPerformances, record);

  if (context.status === "stale") {
    return {
      status: "provisional",
      calibratedAtIso: null,
      recentPerformances: performances,
    };
  }

  const nextStatus = deriveStatusAfterPerformances(performances, context.status);
  const becameCalibrated = nextStatus === "calibrated" && context.status !== "calibrated";

  return {
    status: nextStatus,
    calibratedAtIso: becameCalibrated
      ? session.completedAtIso
      : nextStatus === "calibrated"
        ? context.calibratedAtIso ?? session.completedAtIso
        : null,
    recentPerformances: performances,
  };
}

export function parseCalibrationContext(row: {
  calibration_status: CalibrationStatus;
  calibrated_at: string | null;
  recent_performances: CalibrationPerformanceRecord[] | null;
}): ExerciseCalibrationContext {
  return {
    status: row.calibration_status,
    calibratedAtIso: row.calibrated_at,
    recentPerformances: row.recent_performances ?? [],
  };
}

export type { CalibrationStatus, ExerciseCalibrationContext };
