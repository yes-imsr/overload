const PROGRESSION_REASON_LABELS: Record<string, string> = {
  effort_easy_weight_up: "System increased load after Easy effort.",
  effort_easy_reps_up: "System added reps after Easy effort.",
  effort_medium_weight_up: "System increased load after Medium effort.",
  effort_medium_reps_up: "System added reps after Medium effort.",
  effort_hard_hold: "System held targets after Hard effort.",
  effort_near_death_weight_down: "System reduced load after Near Death effort.",
  effort_near_death_rep_cap: "System capped reps after Near Death effort.",
};

export function formatProgressionReason(reasonCode: string | null | undefined): string | null {
  if (!reasonCode) {
    return null;
  }
  return PROGRESSION_REASON_LABELS[reasonCode] ?? "System adjusted targets from last session.";
}

export function formatTargetSummary(
  plannedWeight: number | null,
  targetRepMin: number | null,
  targetRepMax: number | null,
): string {
  const repRange =
    targetRepMin !== null && targetRepMax !== null
      ? `${targetRepMin}-${targetRepMax} reps`
      : "reps pending";

  if (plannedWeight !== null && plannedWeight > 0) {
    return `${plannedWeight} lb · ${repRange}`;
  }

  return repRange;
}
