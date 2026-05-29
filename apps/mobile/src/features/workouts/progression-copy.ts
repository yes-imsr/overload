const PROGRESSION_REASON_TEXT: Record<string, string> = {
  effort_easy_weight_up: "Load increased after Easy effort.",
  effort_easy_reps_up: "Rep target increased after Easy effort.",
  effort_medium_weight_up: "Load increased after Medium effort.",
  effort_medium_reps_up: "Rep target increased after Medium effort.",
  effort_hard_hold: "Target held after Hard effort.",
  effort_near_death_weight_down: "Load reduced after Near Death effort.",
  effort_near_death_rep_cap: "Rep cap reduced after Near Death effort.",
};

export function getProgressionReasonText(reasonCode: string | null): string | null {
  if (!reasonCode) {
    return null;
  }

  return PROGRESSION_REASON_TEXT[reasonCode] ?? null;
}
