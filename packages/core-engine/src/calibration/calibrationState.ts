import {
  CONSISTENT_E1RM_TOLERANCE_RATIO,
  CONSISTENT_SESSIONS_TO_CALIBRATED,
  MIN_WORKING_SETS_FOR_CALIBRATION,
  SESSIONS_TO_PROVISIONAL,
  STALE_AFTER_DAYS,
} from "./constants";
import type {
  CalibrationPerformanceRecord,
  CalibrationResetReason,
  CalibrationSessionInput,
  CalibrationStatus,
  CalibrationUiLabel,
  CalibrationUiState,
  ExerciseCalibrationContext,
} from "./types";

export function createInitialCalibrationContext(): ExerciseCalibrationContext {
  return {
    status: "uncalibrated",
    calibratedAtIso: null,
    recentPerformances: [],
  };
}

export function toCalibrationUiLabel(status: CalibrationStatus): CalibrationUiLabel {
  switch (status) {
    case "uncalibrated":
      return "Learning";
    case "provisional":
      return "Calibrating";
    case "calibrated":
      return "Stable";
    case "stale":
      return "Stale";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function toCalibrationUiState(status: CalibrationStatus): CalibrationUiState {
  switch (status) {
    case "uncalibrated":
      return "learning";
    case "provisional":
      return "calibrating";
    case "calibrated":
      return "stable";
    case "stale":
      return "stale";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

function isValidPerformance(session: CalibrationSessionInput): boolean {
  return (
    session.completedWorkingSets >= MIN_WORKING_SETS_FOR_CALIBRATION &&
    Number.isFinite(session.bestEstimatedOneRepMax) &&
    session.bestEstimatedOneRepMax > 0
  );
}

function toPerformanceRecord(
  session: CalibrationSessionInput,
): CalibrationPerformanceRecord {
  return {
    sessionId: session.sessionId,
    completedAtIso: session.completedAtIso,
    bestEstimatedOneRepMax: session.bestEstimatedOneRepMax,
  };
}

function appendPerformance(
  performances: readonly CalibrationPerformanceRecord[],
  record: CalibrationPerformanceRecord,
): readonly CalibrationPerformanceRecord[] {
  const withoutDuplicate = performances.filter(
    (entry) => entry.sessionId !== record.sessionId,
  );
  return [...withoutDuplicate, record].slice(-CONSISTENT_SESSIONS_TO_CALIBRATED);
}

function performancesAreConsistent(
  performances: readonly CalibrationPerformanceRecord[],
): boolean {
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

function latestPerformanceAt(
  performances: readonly CalibrationPerformanceRecord[],
): string | null {
  if (performances.length === 0) {
    return null;
  }

  return performances.reduce((latest, entry) =>
    entry.completedAtIso > latest ? entry.completedAtIso : latest,
  performances[0]!.completedAtIso);
}

function daysBetween(isoA: string, isoB: string): number {
  const a = Date.parse(isoA);
  const b = Date.parse(isoB);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new RangeError("completedAtIso must be a valid ISO timestamp");
  }
  return Math.abs(b - a) / (1000 * 60 * 60 * 24);
}

function deriveStatusAfterPerformances(
  performances: readonly CalibrationPerformanceRecord[],
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
  if (!isValidPerformance(session)) {
    return context;
  }

  const record = toPerformanceRecord(session);
  const performances = appendPerformance(context.recentPerformances, record);

  if (context.status === "stale") {
    return {
      status: "provisional",
      calibratedAtIso: null,
      recentPerformances: performances,
    };
  }

  const nextStatus = deriveStatusAfterPerformances(performances, context.status);
  const becameCalibrated =
    nextStatus === "calibrated" && context.status !== "calibrated";

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

export function applyCalibrationStaleCheck(
  context: ExerciseCalibrationContext,
  nowIso: string,
): ExerciseCalibrationContext {
  if (context.status !== "calibrated") {
    return context;
  }

  const lastSessionAt = latestPerformanceAt(context.recentPerformances);
  if (!lastSessionAt) {
    return context;
  }

  if (daysBetween(lastSessionAt, nowIso) < STALE_AFTER_DAYS) {
    return context;
  }

  return {
    ...context,
    status: "stale",
    calibratedAtIso: context.calibratedAtIso,
  };
}

export function applyCalibrationReset(
  context: ExerciseCalibrationContext,
  reason: CalibrationResetReason,
): ExerciseCalibrationContext {
  switch (reason) {
    case "long_break":
      return {
        ...context,
        status: "stale",
      };
    case "manual_reset":
      return {
        status: "provisional",
        calibratedAtIso: null,
        recentPerformances: [],
      };
    case "prestige":
      return {
        status: "provisional",
        calibratedAtIso: null,
        recentPerformances: context.recentPerformances,
      };
    default: {
      const exhaustive: never = reason;
      return exhaustive;
    }
  }
}
