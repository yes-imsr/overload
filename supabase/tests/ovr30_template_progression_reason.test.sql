-- OVR-30: progression_reason_code column on workout_template_exercises

begin;

create extension if not exists pgtap with schema extensions;

select plan(1);

select has_column(
  'public',
  'workout_template_exercises',
  'progression_reason_code',
  'workout_template_exercises has progression_reason_code after OVR-30 migration'
);

select * from finish();

rollback;
