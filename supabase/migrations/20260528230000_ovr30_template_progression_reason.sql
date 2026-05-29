-- OVR-30: persist last progression reason on template exercise targets

alter table public.workout_template_exercises
  add column if not exists progression_reason_code text;
