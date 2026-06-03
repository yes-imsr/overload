/**
 * Edge Function entry: re-exports domain helpers for esbuild bundling into Supabase.
 */
export {
  calculatePowerFromWorkout,
  calculateIdleCredits,
  calculateAggregateIdleRate,
  evaluateNodeUnlock,
} from "./economy/index";
export { applyPowerGainModifier } from "./debuffs/index";
export {
  calculateEntropyAfterWorkout,
  calculateEntropyFromMissedWork,
  evaluateStabilityTaskAssignment,
  resolveStabilityTask,
  ENTROPY_MISS_WORKOUT_GRACE_DAYS,
  ENTROPY_MISS_WORKOUT_PER_DAY,
  ENTROPY_STABILITY_TASK_THRESHOLD,
  STABILITY_TASK_DEBUFF_TYPE,
} from "./entropy/index";
export {
  effortFromRpeLabel,
  recommendProgressionForSession,
} from "./progression/index";
export type { RpeLabel } from "./progression/hardestEffort";
export type { ProgressionRecommendation, ProgressionTarget } from "./progression/types";
