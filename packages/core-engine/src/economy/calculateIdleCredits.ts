import {
  IDLE_CREDITS_PER_POWER_HOUR,
  MAX_IDLE_ACCRUAL_HOURS,
  MS_PER_HOUR,
} from "./constants";
import type { ConvertPowerToCreditsInput, IdleCreditsInput, IdleCreditsResult } from "./types";

function roundCredits(value: number): number {
  return Math.round(value * 100) / 100;
}

function elapsedHoursBetween(startIso: string, endIso: string): number {
  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    throw new RangeError("Timestamps must be valid ISO strings");
  }
  if (endMs < startMs) {
    throw new RangeError("nowIso must be greater than or equal to lastClaimAtIso");
  }
  return (endMs - startMs) / MS_PER_HOUR;
}

export function convertPowerToCredits(input: ConvertPowerToCreditsInput): number {
  if (!Number.isFinite(input.powerAmount) || input.powerAmount < 0) {
    throw new RangeError("powerAmount must be a non-negative finite number");
  }
  if (!Number.isFinite(input.idleRate) || input.idleRate < 0) {
    throw new RangeError("idleRate must be a non-negative finite number");
  }
  if (!Number.isFinite(input.elapsedHours) || input.elapsedHours < 0) {
    throw new RangeError("elapsedHours must be a non-negative finite number");
  }

  const cappedHours = Math.min(input.elapsedHours, MAX_IDLE_ACCRUAL_HOURS);
  return roundCredits(
    input.powerAmount * input.idleRate * IDLE_CREDITS_PER_POWER_HOUR * cappedHours,
  );
}

export function calculateIdleCredits(input: IdleCreditsInput): IdleCreditsResult {
  const elapsedHours = elapsedHoursBetween(input.lastClaimAtIso, input.nowIso);
  const creditsGenerated = convertPowerToCredits({
    powerAmount: input.powerBalance,
    idleRate: input.idleRate,
    elapsedHours,
  });

  return { elapsedHours, creditsGenerated };
}
