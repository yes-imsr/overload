import { DEFAULT_POWER_GAIN_DEBUFF_EFFECT } from "../economy/constants";

export interface PowerGainModifierInput {
  readonly basePower: number;
  readonly debuffEffectValue?: number;
  readonly hasActivePowerGainDebuff: boolean;
}

export interface PowerGainModifierResult {
  readonly powerAwarded: number;
  readonly modifierApplied: number;
}

function roundPower(value: number): number {
  return Math.round(value * 100) / 100;
}

export function applyPowerGainModifier(
  input: PowerGainModifierInput,
): PowerGainModifierResult {
  if (!Number.isFinite(input.basePower) || input.basePower < 0) {
    throw new RangeError("basePower must be a non-negative finite number");
  }

  if (!input.hasActivePowerGainDebuff) {
    return { powerAwarded: roundPower(input.basePower), modifierApplied: 1 };
  }

  const effectValue = input.debuffEffectValue ?? DEFAULT_POWER_GAIN_DEBUFF_EFFECT;
  if (!Number.isFinite(effectValue) || effectValue < 0 || effectValue >= 1) {
    throw new RangeError("debuffEffectValue must be between 0 (inclusive) and 1 (exclusive)");
  }

  const modifierApplied = 1 - effectValue;
  return {
    powerAwarded: roundPower(input.basePower * modifierApplied),
    modifierApplied,
  };
}
