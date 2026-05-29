import { describe, expect, it } from "vitest";
import {
  detectPlateau,
  getHardestEffort,
  recommendProgressionForExercise,
  recommendProgressionsForSession,
} from "../src/progression";

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

describe("getHardestEffort", () => {
  it("returns the highest effort in the completed set list", () => {
    expect(getHardestEffort(["Easy", "Medium", "Hard"])).toBe("Hard");
    expect(getHardestEffort(["Medium", "Near Death", "Easy"])).toBe("Near Death");
  });

  it("rejects empty effort lists", () => {
    expect(() => getHardestEffort([])).toThrow(RangeError);
  });
});

describe("recommendProgressionsForSession", () => {
  it("uses the stored target weight when one exists", () => {
    expect(
      recommendProgressionsForSession([
        {
          exerciseId: "bench",
          currentWeight: 100,
          currentRepTarget: 8,
          completedSets: [{ weight: 125, reps: 8, effort: "Easy" }],
        },
      ]),
    ).toEqual([
      {
        exerciseId: "bench",
        action: "increase",
        nextWeight: 105,
        nextRepTarget: 8,
        reasonCode: "effort_easy_weight_up",
      },
    ]);
  });

  it("establishes a target from completed set load when no stored load exists", () => {
    expect(
      recommendProgressionsForSession([
        {
          exerciseId: "row",
          currentWeight: null,
          currentRepTarget: 10,
          completedSets: [
            { weight: 50, reps: 10, effort: "Medium" },
            { weight: 55, reps: 8, effort: "Medium" },
          ],
        },
      ]),
    ).toEqual([
      {
        exerciseId: "row",
        action: "increase",
        nextWeight: 56.37,
        nextRepTarget: 10,
        reasonCode: "effort_medium_weight_up",
      },
    ]);
  });

  it("caps reps for a no-load Near Death exercise", () => {
    expect(
      recommendProgressionsForSession([
        {
          exerciseId: "pushup",
          currentWeight: null,
          currentRepTarget: 12,
          completedSets: [{ weight: 0, reps: 10, effort: "Near Death" }],
        },
      ]),
    ).toEqual([
      {
        exerciseId: "pushup",
        action: "cap_reps",
        nextWeight: 0,
        nextRepTarget: 10,
        reasonCode: "effort_near_death_rep_cap",
      },
    ]);
  });

  it("holds targets when the hardest effort is Hard", () => {
    expect(
      recommendProgressionsForSession([
        {
          exerciseId: "deadlift",
          currentWeight: 225,
          currentRepTarget: 5,
          completedSets: [
            { weight: 225, reps: 5, effort: "Medium" },
            { weight: 225, reps: 5, effort: "Hard" },
          ],
        },
      ]),
    ).toEqual([
      {
        exerciseId: "deadlift",
        action: "hold",
        nextWeight: 225,
        nextRepTarget: 5,
        reasonCode: "effort_hard_hold",
      },
    ]);
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
