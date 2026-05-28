import {
  CALIBRATION_STATES,
  CALIBRATION_UI_LABELS,
  type CalibrationObservation,
  type CalibrationRules,
  type CalibrationState,
  type CalibrationTransitionInput,
  type CalibrationTransitionReason,
  type CalibrationTransitionResult,
  type CalibrationUiLabel,
} from "./types";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const calibrationStateSet = new Set<string>(CALIBRATION_STATES);

export const DEFAULT_CALIBRATION_RULES = {
  consistencyToleranceRatio: 0.075,
  consistencyWindow: 3,
  minimumConsistentPerformances: 2,
  staleAfterDays: 21,
} as const satisfies CalibrationRules;

export function getCalibrationUiLabel(
  state: CalibrationState,
): CalibrationUiLabel {
  assertCalibrationState(state);
  return CALIBRATION_UI_LABELS[state];
}

export function areCalibrationObservationsConsistent(
  observations: readonly CalibrationObservation[],
  rules: Partial<CalibrationRules> = {},
): boolean {
  const normalizedRules = normalizeRules(rules);
  const sortedObservations = sortObservations(observations);

  if (
    sortedObservations.length < normalizedRules.minimumConsistentPerformances
  ) {
    return false;
  }

  const sample = sortedObservations.slice(
    -Math.min(normalizedRules.consistencyWindow, sortedObservations.length),
  );

  return (
    isSampleWithinTolerance(sample, normalizedRules.consistencyToleranceRatio) ||
    isSampleWithinTolerance(
      sample.slice(-normalizedRules.minimumConsistentPerformances),
      normalizedRules.consistencyToleranceRatio,
    )
  );
}

export function isCalibrationStale(input: {
  readonly lastObservedAtIso?: string;
  readonly asOfIso: string;
  readonly rules?: Partial<CalibrationRules>;
}): boolean {
  if (input.lastObservedAtIso === undefined) {
    return false;
  }

  const normalizedRules = normalizeRules(input.rules);
  const lastObservedAtMs = parseIsoDate(
    "lastObservedAtIso",
    input.lastObservedAtIso,
  );
  const asOfMs = parseIsoDate("asOfIso", input.asOfIso);

  return (
    (asOfMs - lastObservedAtMs) / MILLISECONDS_PER_DAY >=
    normalizedRules.staleAfterDays
  );
}

export function transitionCalibrationState(
  input: CalibrationTransitionInput,
): CalibrationTransitionResult {
  assertCalibrationState(input.currentState);

  const rules = normalizeRules(input.rules);
  const observations = sortObservations([
    ...(input.observations ?? []),
    ...(input.newObservation === undefined ? [] : [input.newObservation]),
  ]);
  const latestObservation = observations.at(-1);

  if (input.calibratedAtIso !== undefined) {
    parseIsoDate("calibratedAtIso", input.calibratedAtIso);
  }

  if (input.resetRequested === true) {
    return buildResult({
      input,
      observations,
      state: observations.length > 0 ? "provisional" : "uncalibrated",
      reason: "reset",
      updatedAtIso: input.asOfIso ?? latestObservation?.completedAtIso,
    });
  }

  if (input.newObservation !== undefined) {
    const state = nextObservedState(observations, rules);
    const reason = getObservationReason(state, observations.length);

    return buildResult({
      input,
      observations,
      state,
      reason,
      updatedAtIso: input.newObservation.completedAtIso,
    });
  }

  if (
    input.asOfIso !== undefined &&
    input.currentState !== "uncalibrated" &&
    isCalibrationStale({
      lastObservedAtIso: latestObservation?.completedAtIso,
      asOfIso: input.asOfIso,
      rules,
    })
  ) {
    return buildResult({
      input,
      observations,
      state: "stale",
      reason: "stale_break",
      updatedAtIso: input.asOfIso,
    });
  }

  return buildResult({
    input,
    observations,
    state: input.currentState,
    reason: "no_change",
    updatedAtIso: input.asOfIso,
  });
}

const assertCalibrationState = (state: CalibrationState): void => {
  if (!calibrationStateSet.has(state)) {
    throw new RangeError(`Unsupported calibration state: ${String(state)}.`);
  }
};

const normalizeRules = (
  rules: Partial<CalibrationRules> = {},
): CalibrationRules => {
  const normalizedRules = {
    ...DEFAULT_CALIBRATION_RULES,
    ...rules,
  };

  validateRatio(
    "consistencyToleranceRatio",
    normalizedRules.consistencyToleranceRatio,
  );
  validatePositiveInteger(
    "consistencyWindow",
    normalizedRules.consistencyWindow,
  );
  validatePositiveInteger(
    "minimumConsistentPerformances",
    normalizedRules.minimumConsistentPerformances,
  );
  validatePositiveNumber("staleAfterDays", normalizedRules.staleAfterDays);

  if (
    normalizedRules.minimumConsistentPerformances >
    normalizedRules.consistencyWindow
  ) {
    throw new RangeError(
      "minimumConsistentPerformances must be less than or equal to consistencyWindow.",
    );
  }

  return normalizedRules;
};

const sortObservations = (
  observations: readonly CalibrationObservation[],
): readonly CalibrationObservation[] =>
  observations
    .map((observation, index) => {
      validateObservation(observation);
      return { index, observedAtMs: parseIsoDate("completedAtIso", observation.completedAtIso), observation };
    })
    .sort((left, right) => {
      if (left.observedAtMs === right.observedAtMs) {
        return left.index - right.index;
      }

      return left.observedAtMs - right.observedAtMs;
    })
    .map(({ observation }) => observation);

const validateObservation = (observation: CalibrationObservation): void => {
  validatePositiveNumber(
    "estimatedOneRepMax",
    observation.estimatedOneRepMax,
  );
};

const parseIsoDate = (name: string, value: string): number => {
  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    throw new RangeError(`${name} must be a valid ISO date string.`);
  }

  return parsed;
};

const validatePositiveNumber = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number greater than 0.`);
  }
};

const validatePositiveInteger = (name: string, value: number): void => {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a whole number greater than 0.`);
  }
};

const validateRatio = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError(`${name} must be a ratio greater than or equal to 0 and less than 1.`);
  }
};

const isSampleWithinTolerance = (
  observations: readonly CalibrationObservation[],
  toleranceRatio: number,
): boolean => {
  if (observations.length < 2) {
    return false;
  }

  const estimates = observations.map(
    (observation) => observation.estimatedOneRepMax,
  );
  const low = Math.min(...estimates);
  const high = Math.max(...estimates);
  const average =
    estimates.reduce((sum, estimate) => sum + estimate, 0) / estimates.length;

  return (high - low) / average <= toleranceRatio;
};

const nextObservedState = (
  observations: readonly CalibrationObservation[],
  rules: CalibrationRules,
): CalibrationState => {
  if (observations.length === 0) {
    return "uncalibrated";
  }

  if (areCalibrationObservationsConsistent(observations, rules)) {
    return "calibrated";
  }

  return "provisional";
};

const getObservationReason = (
  state: CalibrationState,
  observationCount: number,
): CalibrationTransitionReason => {
  if (observationCount === 1) {
    return "first_session";
  }

  if (state === "calibrated") {
    return "consistent_performances";
  }

  return "insufficient_consistency";
};

const buildResult = (params: {
  readonly input: CalibrationTransitionInput;
  readonly observations: readonly CalibrationObservation[];
  readonly state: CalibrationState;
  readonly reason: CalibrationTransitionReason;
  readonly updatedAtIso?: string;
}): CalibrationTransitionResult => {
  const calibratedAtIso = getCalibratedAtIso(params);

  if (params.updatedAtIso !== undefined) {
    parseIsoDate("updatedAtIso", params.updatedAtIso);
  }

  return {
    previousState: params.input.currentState,
    state: params.state,
    uiLabel: getCalibrationUiLabel(params.state),
    reason: params.reason,
    observations: params.observations,
    ...(calibratedAtIso === undefined ? {} : { calibratedAtIso }),
    ...(params.updatedAtIso === undefined
      ? {}
      : { updatedAtIso: params.updatedAtIso }),
  };
};

const getCalibratedAtIso = (params: {
  readonly input: CalibrationTransitionInput;
  readonly observations: readonly CalibrationObservation[];
  readonly state: CalibrationState;
}): string | undefined => {
  if (params.state === "calibrated") {
    return (
      params.input.calibratedAtIso ??
      params.observations.at(-1)?.completedAtIso
    );
  }

  if (params.state === "stale") {
    return params.input.calibratedAtIso;
  }

  return undefined;
};
