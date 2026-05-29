import { describe, expect, it } from "vitest";
import { calculateAggregateIdleRate } from "../src/economy/calculateAggregateIdleRate";
import { evaluateNodeUnlock } from "../src/economy/evaluateNodeUnlock";

describe("calculateAggregateIdleRate", () => {
  it("sums base idle rates for unlocked nodes at level 1", () => {
    expect(
      calculateAggregateIdleRate([
        { isUnlocked: true, level: 1, baseIdleRate: 1 },
        { isUnlocked: true, level: 1, baseIdleRate: 1.5 },
        { isUnlocked: false, level: 0, baseIdleRate: 0.5 },
      ]),
    ).toBe(2.5);
  });

  it("returns zero when no nodes are unlocked", () => {
    expect(
      calculateAggregateIdleRate([
        { isUnlocked: false, level: 0, baseIdleRate: 1 },
      ]),
    ).toBe(0);
  });
});

describe("evaluateNodeUnlock", () => {
  it("allows a free starter unlock when prerequisites are met", () => {
    expect(
      evaluateNodeUnlock({
        creditsBalance: 0,
        unlockCreditsCost: 0,
        isAlreadyUnlocked: false,
        prerequisiteUnlocked: true,
      }),
    ).toEqual({ allowed: true, creditCost: 0 });
  });

  it("blocks unlock when credits are insufficient", () => {
    expect(
      evaluateNodeUnlock({
        creditsBalance: 50,
        unlockCreditsCost: 100,
        isAlreadyUnlocked: false,
        prerequisiteUnlocked: true,
      }),
    ).toEqual({ allowed: false, reasonCode: "insufficient_credits" });
  });

  it("blocks unlock when the prerequisite node is locked", () => {
    expect(
      evaluateNodeUnlock({
        creditsBalance: 500,
        unlockCreditsCost: 100,
        isAlreadyUnlocked: false,
        prerequisiteUnlocked: false,
      }),
    ).toEqual({ allowed: false, reasonCode: "prerequisite_locked" });
  });
});
