import { describe, expect, it } from "vitest";
import {
  calculateIdleCredits,
  calculateIdleRateFromNodes,
  calculatePowerFromWorkout,
  convertPowerToCredits,
} from "../src/economy";

describe("calculatePowerFromWorkout", () => {
  it("derives Power from completed workout volume", () => {
    const result = calculatePowerFromWorkout({
      totalVolume: 1125,
      totalWorkingSets: 3,
    });

    expect(result.basePower).toBe(18);
    expect(result.powerAwarded).toBe(18);
  });

  it("awards no Power when no working sets were logged", () => {
    expect(
      calculatePowerFromWorkout({ totalVolume: 0, totalWorkingSets: 0 }).powerAwarded,
    ).toBe(0);
  });

  it("enforces a minimum Power award for any completed work", () => {
    expect(
      calculatePowerFromWorkout({ totalVolume: 10, totalWorkingSets: 1 }).powerAwarded,
    ).toBe(1);
  });

  it("rejects invalid volume input", () => {
    expect(() =>
      calculatePowerFromWorkout({ totalVolume: -1, totalWorkingSets: 1 }),
    ).toThrow(RangeError);
  });
});

describe("convertPowerToCredits", () => {
  it("converts stored Power to Credits deterministically over elapsed time", () => {
    expect(
      convertPowerToCredits({
        powerAmount: 100,
        idleRate: 1,
        elapsedHours: 4.2,
      }),
    ).toBe(420);
  });

  it("returns zero when no Power is stored", () => {
    expect(
      convertPowerToCredits({
        powerAmount: 0,
        idleRate: 1.5,
        elapsedHours: 10,
      }),
    ).toBe(0);
  });
});

describe("calculateIdleCredits", () => {
  it("uses the last claim timestamp and current time for accrual", () => {
    const result = calculateIdleCredits({
      powerBalance: 100,
      idleRate: 1,
      lastClaimAtIso: "2026-05-28T10:00:00.000Z",
      nowIso: "2026-05-28T14:12:00.000Z",
    });

    expect(result.elapsedHours).toBeCloseTo(4.2, 10);
    expect(result.creditsGenerated).toBe(420);
  });

  it("rejects timestamps that move backwards", () => {
    expect(() =>
      calculateIdleCredits({
        powerBalance: 100,
        idleRate: 1,
        lastClaimAtIso: "2026-05-28T14:00:00.000Z",
        nowIso: "2026-05-28T10:00:00.000Z",
      }),
    ).toThrow(RangeError);
  });
});

describe("calculateIdleRateFromNodes", () => {
  it("sums unlocked node rates by level", () => {
    expect(
      calculateIdleRateFromNodes({
        nodes: [
          { baseIdleRate: 1, level: 1, isUnlocked: true },
          { baseIdleRate: 1.5, level: 1, isUnlocked: true },
          { baseIdleRate: 9, level: 0, isUnlocked: true },
          { baseIdleRate: 4, level: 1, isUnlocked: false },
        ],
      }),
    ).toBe(2.5);
  });

  it("rounds deterministic fractional node rates", () => {
    expect(
      calculateIdleRateFromNodes({
        nodes: [
          { baseIdleRate: 0.33333, level: 1, isUnlocked: true },
          { baseIdleRate: 0.33333, level: 2, isUnlocked: true },
        ],
      }),
    ).toBe(1);
  });

  it("rejects invalid node rate input", () => {
    expect(() =>
      calculateIdleRateFromNodes({
        nodes: [{ baseIdleRate: -1, level: 1, isUnlocked: true }],
      }),
    ).toThrow(RangeError);
  });
});
