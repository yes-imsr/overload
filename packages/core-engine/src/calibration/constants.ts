/** Minimum completed working sets in a session to count toward calibration. */
export const MIN_WORKING_SETS_FOR_CALIBRATION = 1;

/** Sessions required to leave uncalibrated for provisional. */
export const SESSIONS_TO_PROVISIONAL = 1;

/** Consistent performances required to reach calibrated (MVP: 2–3; engine uses 2). */
export const CONSISTENT_SESSIONS_TO_CALIBRATED = 2;

/** Max relative deviation from median e1RM for performances to count as consistent. */
export const CONSISTENT_E1RM_TOLERANCE_RATIO = 0.08;

/** Days without a logged session before calibrated data is marked stale. */
export const STALE_AFTER_DAYS = 21;
