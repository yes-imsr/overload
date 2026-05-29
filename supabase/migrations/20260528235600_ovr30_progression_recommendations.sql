-- OVR-30: persist applied progression recommendations on template exercise rows.

alter table public.workout_template_exercises
  add column last_progression_action text
    check (
      last_progression_action is null
      or last_progression_action in ('increase', 'hold', 'reduce', 'cap_reps')
    ),
  add column last_progression_reason_code text
    check (
      last_progression_reason_code is null
      or last_progression_reason_code in (
        'effort_easy_weight_up',
        'effort_easy_reps_up',
        'effort_medium_weight_up',
        'effort_medium_reps_up',
        'effort_hard_hold',
        'effort_near_death_weight_down',
        'effort_near_death_rep_cap'
      )
    ),
  add column last_progression_source_session_id uuid
    references public.workout_sessions (id),
  add column last_progression_applied_at timestamptz;
