import { describe, expect, it } from "vitest";
import { applyPowerGainModifier } from "../src/debuffs";

describe("applyPowerGainModifier", () => {
  it("returns the base Power when no debuff is active", () => {
    expect(
      applyPowerGainModifier({
        basePower: 18,
        hasActivePowerGainDebuff: false,
      }),
    ).toEqual({
      powerAwarded: 18,
      modifierApplied: 1,
    });
  });

  it("applies the MVP -15% Power gain debuff", () => {
    expect(
      applyPowerGainModifier({
        basePower: 100,
        hasActivePowerGainDebuff: true,
      }),
    ).toEqual({
      powerAwarded: 85,
      modifierApplied: 0.85,
    });
  });

  it("supports custom debuff effect values", () => {
    expect(
      applyPowerGainModifier({
        basePower: 50,
        hasActivePowerGainDebuff: true,
        debuffEffectValue: 0.1,
      }).powerAwarded,
    ).toBe(45);
  });
});
