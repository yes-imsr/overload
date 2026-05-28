import { describe, expect, it } from "vitest";
import {
  buildPrestigeTarget,
  evaluatePrestigeAttempt,
  evaluatePrestigeEligibility,
} from "../src/prestige";

describe("evaluatePrestigeEligibility", () => {
  const baseInput = {
    creditsBalance: 300,
    entropy: 5,
    prestigeLevel: 0,
    hasActiveAttempt: false,
    lockoutUntilIso: null,
    nowIso: "2026-05-28T12:00:00.000Z",
    calibratedExerciseCount: 2,
  };

  it("approves eligible users with stable calibration and credits", () => {
    expect(evaluatePrestigeEligibility(baseInput)).toEqual({
      eligible: true,
      blockers: [],
    });
  });

  it("blocks prestige when credits, entropy, or calibration are insufficient", () => {
    const result = evaluatePrestigeEligibility({
      ...baseInput,
      creditsBalance: 100,
      entropy: 15,
      calibratedExerciseCount: 0,
      hasActiveAttempt: true,
      lockoutUntilIso: "2026-05-29T12:00:00.000Z",
    });

    expect(result.eligible).toBe(false);
    expect(result.blockers).toEqual([
      "active_attempt",
      "lockout_active",
      "insufficient_credits",
      "entropy_too_high",
      "insufficient_calibration",
    ]);
  });
});

describe("buildPrestigeTarget", () => {
  it("requires a calibrated e1RM improvement for estimated_1rm attempts", () => {
    expect(
      buildPrestigeTarget({
        exerciseId: "squat",
        metric: "estimated_1rm",
        bestEstimatedOneRepMax: 200,
        bestRepRecord: 5,
      }),
    ).toEqual({
      exerciseId: "squat",
      metric: "estimated_1rm",
      targetValue: 204,
      requiredCredits: 250,
    });
  });

  it("requires one more rep for rep_pr attempts", () => {
    expect(
      buildPrestigeTarget({
        exerciseId: "bench",
        metric: "rep_pr",
        bestEstimatedOneRepMax: 180,
        bestRepRecord: 8,
      }).targetValue,
    ).toBe(9);
  });
});

describe("evaluatePrestigeAttempt", () => {
  const target = buildPrestigeTarget({
    exerciseId: "squat",
    metric: "estimated_1rm",
    bestEstimatedOneRepMax: 200,
    bestRepRecord: 5,
  });

  it("marks success when the target metric is achieved", () => {
    expect(
      evaluatePrestigeAttempt(
        {
          target,
          achievedEstimatedOneRepMax: 205,
          achievedRepRecord: 5,
        },
        0,
      ),
    ).toEqual({
      succeeded: true,
      achievedValue: 205,
      creditPenalty: 0,
      lockoutHours: 0,
      nextPrestigeLevel: 1,
    });
  });

  it("applies failure penalties when the target is missed", () => {
    expect(
      evaluatePrestigeAttempt(
        {
          target,
          achievedEstimatedOneRepMax: 198,
          achievedRepRecord: 5,
        },
        1,
      ),
    ).toEqual({
      succeeded: false,
      achievedValue: 198,
      creditPenalty: 50,
      lockoutHours: 72,
      nextPrestigeLevel: 1,
    });
  });
});
