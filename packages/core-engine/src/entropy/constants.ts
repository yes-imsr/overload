/** Entropy level that triggers the MVP Stability Task assignment. */
export const ENTROPY_STABILITY_TASK_THRESHOLD = 15;

/** Maximum entropy allowed to start a prestige attempt. */
export const ENTROPY_PRESTIGE_MAX = 10;

export const ENTROPY_MAX = 100;

/** Entropy added per day without a completed workout after grace period. */
export const ENTROPY_MISS_WORKOUT_PER_DAY = 2;

/** Grace days before missed-work entropy starts rising. */
export const ENTROPY_MISS_WORKOUT_GRACE_DAYS = 2;

/** Entropy added when a session includes Near Death effort. */
export const ENTROPY_NEAR_DEATH_SESSION = 2;

/** Entropy added when stale calibrated exercises appear in a session. */
export const ENTROPY_STALE_EXERCISE_COUNT = 3;

/** Entropy reduced when a Stability Task workout is completed. */
export const ENTROPY_STABILITY_TASK_RESOLUTION = 8;

/** Entropy reduced on successful prestige. */
export const ENTROPY_PRESTIGE_SUCCESS_REDUCTION = 5;

/** MVP Stability Task debuff type identifier. */
export const STABILITY_TASK_DEBUFF_TYPE = "power_gain_reduction" as const;
