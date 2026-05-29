/**
 * Edge Function entry: re-exports domain helpers for esbuild bundling into Supabase.
 */
export { calculatePowerFromWorkout } from "./economy/calculatePowerFromWorkout";
export { applyPowerGainModifier } from "./debuffs/applyPowerGainModifier";
export {
  calculateEntropyAfterWorkout,
  calculateEntropyFromMissedWork,
  evaluateStabilityTaskAssignment,
  resolveStabilityTask,
} from "./entropy/calculateEntropy";
export {
  effortFromRpeLabel,
  recommendProgressionForSession,
} from "./progression/index";
export type { RpeLabel } from "./progression/hardestEffort";
export type { ProgressionRecommendation, ProgressionTarget } from "./progression/types";
