/** Stored Power converts to Credits at this rate per hour (power * rate * hours). */
export const IDLE_CREDITS_PER_POWER_HOUR = 1;

/** Total session volume maps to Power through this divisor (1125 volume -> 18 Power). */
export const POWER_VOLUME_DIVISOR = 62.5;

export const MIN_POWER_AWARD = 1;

/** MVP debuff reduces Power gain by 15%. */
export const DEFAULT_POWER_GAIN_DEBUFF_EFFECT = 0.15;

/** Milliseconds in one hour for idle conversion. */
export const MS_PER_HOUR = 60 * 60 * 1000;

/** Maximum idle accrual window to prevent runaway claims (7 days). */
export const MAX_IDLE_ACCRUAL_HOURS = 24 * 7;
