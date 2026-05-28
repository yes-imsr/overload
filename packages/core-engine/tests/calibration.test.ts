import { describe, expect, it } from "vitest";
import {
  areCalibrationObservationsConsistent,
  CALIBRATION_STATES,
  CALIBRATION_UI_LABELS,
  getCalibrationUiLabel,
  isCalibrationStale,
  transitionCalibrationState,
  type CalibrationObservation,
  type CalibrationState,
} from "../src/index";

const observed = (
  completedAtIso: string,
  estimatedOneRepMax: number,
): CalibrationObservation => ({
  completedAtIso,
  estimatedOneRepMax,
});

describe("calibration labels", () => {
  it("supports only the MVP internal calibration states", () => {
    expect(CALIBRATION_STATES).toEqual([
      "uncalibrated",
      "provisional",
      "calibrated",
      "stale",
    ]);
  });

  it("maps internal states to the product UI labels", () => {
    expect(CALIBRATION_UI_LABELS).toEqual({
      uncalibrated: "Learning",
      provisional: "Calibrating",
      calibrated: "Stable",
      stale: "Stale",
    });
    expect(getCalibrationUiLabel("uncalibrated")).toBe("Learning");
    expect(getCalibrationUiLabel("provisional")).toBe("Calibrating");
    expect(getCalibrationUiLabel("calibrated")).toBe("Stable");
    expect(getCalibrationUiLabel("stale")).toBe("Stale");
  });
});

describe("areCalibrationObservationsConsistent", () => {
  it("requires at least two performances before reporting consistency", () => {
    expect(
      areCalibrationObservationsConsistent([
        observed("2026-05-01T12:00:00.000Z", 250),
      ]),
    ).toBe(false);
  });

  it("treats two close e1RM estimates as consistent", () => {
    expect(
      areCalibrationObservationsConsistent([
        observed("2026-05-01T12:00:00.000Z", 250),
        observed("2026-05-04T12:00:00.000Z", 260),
      ]),
    ).toBe(true);
  });

  it("can use the latest two performances when a third replaces an outlier", () => {
    expect(
      areCalibrationObservationsConsistent([
        observed("2026-05-01T12:00:00.000Z", 250),
        observed("2026-05-04T12:00:00.000Z", 310),
        observed("2026-05-08T12:00:00.000Z", 315),
      ]),
    ).toBe(true);
  });

  it("rejects spread outside the configured tolerance", () => {
    expect(
      areCalibrationObservationsConsistent([
        observed("2026-05-01T12:00:00.000Z", 250),
        observed("2026-05-04T12:00:00.000Z", 300),
      ]),
    ).toBe(false);
  });
});

describe("isCalibrationStale", () => {
  it("marks a calibration stale after the configured break", () => {
    expect(
      isCalibrationStale({
        lastObservedAtIso: "2026-05-01T12:00:00.000Z",
        asOfIso: "2026-05-22T12:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("does not mark missing or recent data stale", () => {
    expect(
      isCalibrationStale({
        asOfIso: "2026-05-22T12:00:00.000Z",
      }),
    ).toBe(false);
    expect(
      isCalibrationStale({
        lastObservedAtIso: "2026-05-10T12:00:00.000Z",
        asOfIso: "2026-05-22T12:00:00.000Z",
      }),
    ).toBe(false);
  });
});

describe("transitionCalibrationState", () => {
  it("moves a first logged session from uncalibrated toward provisional", () => {
    const result = transitionCalibrationState({
      currentState: "uncalibrated",
      newObservation: observed("2026-05-01T12:00:00.000Z", 250),
    });

    expect(result).toMatchObject({
      previousState: "uncalibrated",
      state: "provisional",
      uiLabel: "Calibrating",
      reason: "first_session",
      updatedAtIso: "2026-05-01T12:00:00.000Z",
    });
    expect(result.calibratedAtIso).toBeUndefined();
  });

  it("marks calibrated after two consistent performances", () => {
    const result = transitionCalibrationState({
      currentState: "provisional",
      observations: [observed("2026-05-01T12:00:00.000Z", 250)],
      newObservation: observed("2026-05-04T12:00:00.000Z", 260),
    });

    expect(result).toMatchObject({
      previousState: "provisional",
      state: "calibrated",
      uiLabel: "Stable",
      reason: "consistent_performances",
      calibratedAtIso: "2026-05-04T12:00:00.000Z",
    });
  });

  it("can mark calibrated on the third performance when the latest pair is consistent", () => {
    const result = transitionCalibrationState({
      currentState: "provisional",
      observations: [
        observed("2026-05-01T12:00:00.000Z", 250),
        observed("2026-05-04T12:00:00.000Z", 310),
      ],
      newObservation: observed("2026-05-08T12:00:00.000Z", 315),
    });

    expect(result).toMatchObject({
      state: "calibrated",
      reason: "consistent_performances",
      calibratedAtIso: "2026-05-08T12:00:00.000Z",
    });
  });

  it("keeps inconsistent performances provisional", () => {
    const result = transitionCalibrationState({
      currentState: "provisional",
      observations: [observed("2026-05-01T12:00:00.000Z", 250)],
      newObservation: observed("2026-05-04T12:00:00.000Z", 300),
    });

    expect(result).toMatchObject({
      state: "provisional",
      uiLabel: "Calibrating",
      reason: "insufficient_consistency",
    });
    expect(result.calibratedAtIso).toBeUndefined();
  });

  it("marks calibrated data stale after a long break without logging", () => {
    const result = transitionCalibrationState({
      currentState: "calibrated",
      calibratedAtIso: "2026-05-04T12:00:00.000Z",
      observations: [
        observed("2026-05-01T12:00:00.000Z", 250),
        observed("2026-05-04T12:00:00.000Z", 260),
      ],
      asOfIso: "2026-05-26T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      previousState: "calibrated",
      state: "stale",
      uiLabel: "Stale",
      reason: "stale_break",
      calibratedAtIso: "2026-05-04T12:00:00.000Z",
      updatedAtIso: "2026-05-26T12:00:00.000Z",
    });
  });

  it("moves reset calibrated data back to provisional when observations remain", () => {
    const result = transitionCalibrationState({
      currentState: "calibrated",
      calibratedAtIso: "2026-05-04T12:00:00.000Z",
      observations: [
        observed("2026-05-01T12:00:00.000Z", 250),
        observed("2026-05-04T12:00:00.000Z", 260),
      ],
      asOfIso: "2026-05-10T12:00:00.000Z",
      resetRequested: true,
    });

    expect(result).toMatchObject({
      previousState: "calibrated",
      state: "provisional",
      uiLabel: "Calibrating",
      reason: "reset",
      updatedAtIso: "2026-05-10T12:00:00.000Z",
    });
    expect(result.calibratedAtIso).toBeUndefined();
  });

  it("keeps reset empty data uncalibrated", () => {
    const result = transitionCalibrationState({
      currentState: "stale",
      asOfIso: "2026-05-10T12:00:00.000Z",
      resetRequested: true,
    });

    expect(result).toMatchObject({
      previousState: "stale",
      state: "uncalibrated",
      uiLabel: "Learning",
      reason: "reset",
    });
  });

  it("preserves current state when no transition input is provided", () => {
    const result = transitionCalibrationState({
      currentState: "calibrated",
      calibratedAtIso: "2026-05-04T12:00:00.000Z",
      observations: [
        observed("2026-05-01T12:00:00.000Z", 250),
        observed("2026-05-04T12:00:00.000Z", 260),
      ],
      asOfIso: "2026-05-05T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      state: "calibrated",
      uiLabel: "Stable",
      reason: "no_change",
      calibratedAtIso: "2026-05-04T12:00:00.000Z",
    });
  });

  it("rejects invalid states, observations, dates, and rules", () => {
    expect(() =>
      getCalibrationUiLabel("learning" as CalibrationState),
    ).toThrow(RangeError);
    expect(() =>
      transitionCalibrationState({
        currentState: "uncalibrated",
        newObservation: observed("not-a-date", 250),
      }),
    ).toThrow(RangeError);
    expect(() =>
      transitionCalibrationState({
        currentState: "uncalibrated",
        newObservation: observed("2026-05-01T12:00:00.000Z", 0),
      }),
    ).toThrow(RangeError);
    expect(() =>
      transitionCalibrationState({
        currentState: "uncalibrated",
        rules: {
          consistencyWindow: 1,
          minimumConsistentPerformances: 2,
        },
      }),
    ).toThrow(RangeError);
  });
});
