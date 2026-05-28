import { describe, expect, it } from "vitest";
import {
  CALIBRATION_STATUSES,
  applyCalibrationReset,
  applyCalibrationStaleCheck,
  applyCompletedCalibrationSession,
  createInitialCalibrationContext,
  toCalibrationUiLabel,
  toCalibrationUiState,
} from "../src/index";

const session = (
  id: string,
  completedAtIso: string,
  e1rm: number,
  completedWorkingSets = 3,
) => ({
  sessionId: id,
  completedAtIso,
  bestEstimatedOneRepMax: e1rm,
  completedWorkingSets,
});

describe("calibration labels", () => {
  it("maps internal states to MVP UI labels", () => {
    expect(toCalibrationUiLabel("uncalibrated")).toBe("Learning");
    expect(toCalibrationUiLabel("provisional")).toBe("Calibrating");
    expect(toCalibrationUiLabel("calibrated")).toBe("Stable");
    expect(toCalibrationUiLabel("stale")).toBe("Stale");
  });

  it("maps internal states to UI badge states", () => {
    expect(toCalibrationUiState("uncalibrated")).toBe("learning");
    expect(toCalibrationUiState("provisional")).toBe("calibrating");
    expect(toCalibrationUiState("calibrated")).toBe("stable");
    expect(toCalibrationUiState("stale")).toBe("stale");
  });

  it("exports exactly four calibration statuses", () => {
    expect(CALIBRATION_STATUSES).toEqual([
      "uncalibrated",
      "provisional",
      "calibrated",
      "stale",
    ]);
  });
});

describe("uncalibrated → provisional", () => {
  it("starts in uncalibrated", () => {
    const initial = createInitialCalibrationContext();
    expect(initial.status).toBe("uncalibrated");
    expect(initial.recentPerformances).toEqual([]);
  });

  it("moves to provisional after the first valid logged session", () => {
    let context = createInitialCalibrationContext();
    context = applyCompletedCalibrationSession(
      context,
      session("s1", "2026-05-01T12:00:00.000Z", 200),
    );

    expect(context.status).toBe("provisional");
    expect(context.recentPerformances).toHaveLength(1);
    expect(context.calibratedAtIso).toBeNull();
  });

  it("ignores sessions without working sets or e1RM", () => {
    let context = createInitialCalibrationContext();
    context = applyCompletedCalibrationSession(
      context,
      session("s1", "2026-05-01T12:00:00.000Z", 0, 0),
    );

    expect(context.status).toBe("uncalibrated");
    expect(context.recentPerformances).toHaveLength(0);
  });
});

describe("provisional → calibrated", () => {
  it("marks calibrated after two consistent performances", () => {
    let context = createInitialCalibrationContext();
    context = applyCompletedCalibrationSession(
      context,
      session("s1", "2026-05-01T12:00:00.000Z", 200),
    );
    context = applyCompletedCalibrationSession(
      context,
      session("s2", "2026-05-03T12:00:00.000Z", 205),
    );

    expect(context.status).toBe("calibrated");
    expect(context.calibratedAtIso).toBe("2026-05-03T12:00:00.000Z");
    expect(toCalibrationUiLabel(context.status)).toBe("Stable");
  });

  it("stays provisional when performances are inconsistent", () => {
    let context = createInitialCalibrationContext();
    context = applyCompletedCalibrationSession(
      context,
      session("s1", "2026-05-01T12:00:00.000Z", 200),
    );
    context = applyCompletedCalibrationSession(
      context,
      session("s2", "2026-05-03T12:00:00.000Z", 260),
    );

    expect(context.status).toBe("provisional");
    expect(context.calibratedAtIso).toBeNull();
  });
});

describe("calibrated → stale and resume", () => {
  it("marks stale after a long break", () => {
    let context = createInitialCalibrationContext();
    context = applyCompletedCalibrationSession(
      context,
      session("s1", "2026-05-01T12:00:00.000Z", 200),
    );
    context = applyCompletedCalibrationSession(
      context,
      session("s2", "2026-05-03T12:00:00.000Z", 202),
    );

    context = applyCalibrationStaleCheck(context, "2026-05-30T12:00:00.000Z");

    expect(context.status).toBe("stale");
    expect(toCalibrationUiLabel(context.status)).toBe("Stale");
  });

  it("returns to provisional after stale exercise is trained again", () => {
    let context = createInitialCalibrationContext();
    context = applyCompletedCalibrationSession(
      context,
      session("s1", "2026-05-01T12:00:00.000Z", 200),
    );
    context = applyCompletedCalibrationSession(
      context,
      session("s2", "2026-05-03T12:00:00.000Z", 202),
    );
    context = applyCalibrationStaleCheck(context, "2026-05-30T12:00:00.000Z");
    context = applyCompletedCalibrationSession(
      context,
      session("s3", "2026-05-31T12:00:00.000Z", 198),
    );

    expect(context.status).toBe("provisional");
    expect(context.calibratedAtIso).toBeNull();
  });
});

describe("reset inputs", () => {
  it("manual reset moves to provisional with cleared performances", () => {
    let context = createInitialCalibrationContext();
    context = applyCompletedCalibrationSession(
      context,
      session("s1", "2026-05-01T12:00:00.000Z", 200),
    );
    context = applyCompletedCalibrationSession(
      context,
      session("s2", "2026-05-03T12:00:00.000Z", 202),
    );

    context = applyCalibrationReset(context, "manual_reset");

    expect(context.status).toBe("provisional");
    expect(context.recentPerformances).toEqual([]);
    expect(context.calibratedAtIso).toBeNull();
  });

  it("prestige reset moves calibrated exercise back to provisional", () => {
    let context = createInitialCalibrationContext();
    context = applyCompletedCalibrationSession(
      context,
      session("s1", "2026-05-01T12:00:00.000Z", 200),
    );
    context = applyCompletedCalibrationSession(
      context,
      session("s2", "2026-05-03T12:00:00.000Z", 202),
    );

    context = applyCalibrationReset(context, "prestige");

    expect(context.status).toBe("provisional");
    expect(context.calibratedAtIso).toBeNull();
    expect(context.recentPerformances).toHaveLength(2);
  });

  it("long break reset marks stale without requiring date math first", () => {
    let context = createInitialCalibrationContext();
    context = applyCompletedCalibrationSession(
      context,
      session("s1", "2026-05-01T12:00:00.000Z", 200),
    );
    context = applyCompletedCalibrationSession(
      context,
      session("s2", "2026-05-03T12:00:00.000Z", 202),
    );

    context = applyCalibrationReset(context, "long_break");

    expect(context.status).toBe("stale");
  });
});

describe("determinism", () => {
  it("produces identical transitions for identical inputs", () => {
    const run = () => {
      let context = createInitialCalibrationContext();
      context = applyCompletedCalibrationSession(
        context,
        session("s1", "2026-05-01T12:00:00.000Z", 225),
      );
      context = applyCompletedCalibrationSession(
        context,
        session("s2", "2026-05-04T12:00:00.000Z", 230),
      );
      return context;
    };

    expect(run()).toEqual(run());
  });
});
