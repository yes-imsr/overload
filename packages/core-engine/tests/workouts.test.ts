import { describe, expect, it } from "vitest";
import {
  EFFORT_OPTIONS,
  estimateOneRepMax,
  type Effort,
  type ExerciseResult,
  type WorkoutSessionSummary,
  type WorkoutSet,
} from "../src/index";

describe("workout models", () => {
  it("exports the MVP effort options", () => {
    expect(EFFORT_OPTIONS).toEqual(["Easy", "Medium", "Hard", "Near Death"]);
  });

  it("supports workout set, exercise result, and session summary contracts", () => {
    const effort: Effort = "Hard";
    const set: WorkoutSet = {
      exerciseId: "exercise-squat",
      setOrder: 1,
      setType: "working",
      weight: 225,
      weightUnit: "lb",
      reps: 5,
      effort,
    };

    const exerciseResult: ExerciseResult = {
      exerciseId: set.exerciseId,
      sets: [set],
      totalVolume: 1125,
      bestEstimatedOneRepMax: 262.5,
      hardestEffort: effort,
    };

    const sessionSummary: WorkoutSessionSummary = {
      sessionId: "session-1",
      completedAtIso: "2026-05-27T23:20:00.000Z",
      exerciseResults: [exerciseResult],
      totalSets: 1,
      totalVolume: 1125,
    };

    expect(sessionSummary.exerciseResults[0]?.sets[0]).toEqual(set);
  });
});

describe("estimateOneRepMax", () => {
  it("returns the lifted weight for a one-rep set", () => {
    expect(estimateOneRepMax({ weight: 315, reps: 1 })).toBe(315);
  });

  it("uses a deterministic Epley estimate for multi-rep sets", () => {
    const firstEstimate = estimateOneRepMax({ weight: 225, reps: 5 });
    const secondEstimate = estimateOneRepMax({ weight: 225, reps: 5 });

    expect(firstEstimate).toBe(262.5);
    expect(secondEstimate).toBe(firstEstimate);
  });

  it("handles decimal weights without rounding hidden inside the helper", () => {
    expect(estimateOneRepMax({ weight: 82.5, reps: 8 })).toBeCloseTo(104.5, 10);
  });

  it("rejects invalid inputs instead of guessing", () => {
    expect(() => estimateOneRepMax({ weight: -1, reps: 5 })).toThrow(RangeError);
    expect(() => estimateOneRepMax({ weight: 100, reps: 0 })).toThrow(RangeError);
    expect(() => estimateOneRepMax({ weight: 100, reps: 2.5 })).toThrow(RangeError);
    expect(() => estimateOneRepMax({ weight: Number.NaN, reps: 5 })).toThrow(RangeError);
  });
});
