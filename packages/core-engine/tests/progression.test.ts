import { describe, expect, it } from "vitest";
import { detectPlateau, recommendProgressionForExercise } from "../src/progression";

describe("recommendProgressionForExercise", () => {
  const target = {
    exerciseId: "squat",
    currentWeight: 200,
    currentRepTarget: 5,
  };

  it("increases load after Easy effort", () => {
    expect(recommendProgressionForExercise(target, "Easy")).toEqual({
      exerciseId: "squat",
      action: "increase",
      nextWeight: 210,
      nextRepTarget: 5,
      reasonCode: "effort_easy_weight_up",
    });
  });

  it("increases load after Medium effort", () => {
    expect(recommendProgressionForExercise(target, "Medium")).toEqual({
      exerciseId: "squat",
      action: "increase",
      nextWeight: 205,
      nextRepTarget: 5,
      reasonCode: "effort_medium_weight_up",
    });
  });

  it("holds after Hard effort", () => {
    expect(recommendProgressionForExercise(target, "Hard")).toEqual({
      exerciseId: "squat",
      action: "hold",
      nextWeight: 200,
      nextRepTarget: 5,
      reasonCode: "effort_hard_hold",
    });
  });

  it("reduces or caps after Near Death effort", () => {
    expect(recommendProgressionForExercise(target, "Near Death")).toEqual({
      exerciseId: "squat",
      action: "reduce",
      nextWeight: 195,
      nextRepTarget: 5,
      reasonCode: "effort_near_death_weight_down",
    });

    expect(
      recommendProgressionForExercise(
        { ...target, currentWeight: 0 },
        "Near Death",
      ).action,
    ).toBe("cap_reps");
  });
});

describe("detectPlateau", () => {
  it("flags plateau after three consecutive struggle sessions", () => {
    const sessions = [
      { sessionId: "s1", hardestEffort: "Hard" as const, metTargets: true },
      { sessionId: "s2", hardestEffort: "Near Death" as const, metTargets: true },
      { sessionId: "s3", hardestEffort: "Hard" as const, metTargets: false },
    ];

    expect(detectPlateau(sessions)).toEqual({
      isPlateau: true,
      failedSessionCount: 3,
    });
  });

  it("resets the streak after a successful easy session", () => {
    const sessions = [
      { sessionId: "s1", hardestEffort: "Hard" as const, metTargets: true },
      { sessionId: "s2", hardestEffort: "Easy" as const, metTargets: true },
      { sessionId: "s3", hardestEffort: "Hard" as const, metTargets: true },
    ];

    expect(detectPlateau(sessions)).toEqual({
      isPlateau: false,
      failedSessionCount: 1,
    });
  });
});
