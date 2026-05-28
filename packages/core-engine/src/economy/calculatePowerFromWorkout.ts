import { MIN_POWER_AWARD, POWER_VOLUME_DIVISOR } from "./constants";
import type { PowerCalculationInput, PowerCalculationResult } from "./types";

function roundPower(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculatePowerFromWorkout(
  input: PowerCalculationInput,
): PowerCalculationResult {
  if (!Number.isFinite(input.totalVolume) || input.totalVolume < 0) {
    throw new RangeError("totalVolume must be a non-negative finite number");
  }
  if (!Number.isFinite(input.totalWorkingSets) || input.totalWorkingSets < 0) {
    throw new RangeError("totalWorkingSets must be a non-negative finite number");
  }

  if (input.totalWorkingSets === 0) {
    return { basePower: 0, powerAwarded: 0 };
  }

  const rawPower = input.totalVolume / POWER_VOLUME_DIVISOR;
  const basePower = roundPower(rawPower);
  const powerAwarded = roundPower(Math.max(MIN_POWER_AWARD, basePower));

  return { basePower, powerAwarded };
}
