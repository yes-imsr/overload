import { describe, expect, it } from "vitest";
import {
  calculateEntropyAfterWorkout,
  calculateEntropyFromMissedWork,
  evaluateStabilityTaskAssignment,
  resolveStabilityTask,
} from "../src/entropy";

describe("calculateEntropyAfterWorkout", () => {
  it("adds entropy for Near Death effort and stale exercises", () => {
    const result = calculateEntropyAfterWorkout(4, {
      hasNearDeathEffort: true,
      staleExerciseCount: 1,
    });

    expect(result.delta).toBe(5);
    expect(result.nextEntropy).toBe(9);
    expect(result.reasons).toEqual(["near_death_effort", "stale_exercises"]);
  });

  it("leaves entropy unchanged for stable sessions", () => {
    const result = calculateEntropyAfterWorkout(6, {
      hasNearDeathEffort: false,
      staleExerciseCount: 0,
    });

    expect(result.delta).toBe(0);
    expect(result.nextEntropy).toBe(6);
    expect(result.reasons).toEqual([]);
  });
});

describe("calculateEntropyFromMissedWork", () => {
  it("waits for the grace period before entropy rises", () => {
    expect(
      calculateEntropyFromMissedWork(0, { daysSinceLastWorkout: 2 }).nextEntropy,
    ).toBe(0);
  });

  it("adds entropy after missed workout days accumulate", () => {
    const result = calculateEntropyFromMissedWork(5, { daysSinceLastWorkout: 7 });
    expect(result.nextEntropy).toBe(15);
    expect(result.reasons).toEqual(["missed_workouts"]);
  });
});

describe("Stability Task rules", () => {
  it("assigns one safe system task when entropy crosses the threshold", () => {
    expect(
      evaluateStabilityTaskAssignment({
        entropy: 15,
        hasActiveStabilityTask: false,
      }),
    ).toEqual({
      shouldAssign: true,
      debuffType: "power_gain_reduction",
    });
  });

  it("does not assign duplicate Stability Tasks", () => {
    expect(
      evaluateStabilityTaskAssignment({
        entropy: 20,
        hasActiveStabilityTask: true,
      }).shouldAssign,
    ).toBe(false);
  });

  it("reduces entropy after a Stability Task is resolved", () => {
    expect(resolveStabilityTask({ currentEntropy: 18 })).toEqual({
      entropyAfter: 10,
      entropyDelta: -8,
    });
  });
});
