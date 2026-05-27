-- OVERLOAD-001B: built-in exercise catalog seed

insert into public.exercises (
  id,
  user_id,
  name,
  movement_pattern,
  primary_muscle_group,
  equipment_type,
  is_builtin,
  calibration_status
)
values
  (
    'a0000001-0000-4000-8000-000000000001',
    null,
    'Barbell Back Squat',
    'squat',
    'quads',
    'barbell',
    true,
    'uncalibrated'
  ),
  (
    'a0000001-0000-4000-8000-000000000002',
    null,
    'Barbell Bench Press',
    'push',
    'chest',
    'barbell',
    true,
    'uncalibrated'
  ),
  (
    'a0000001-0000-4000-8000-000000000003',
    null,
    'Barbell Deadlift',
    'hinge',
    'posterior_chain',
    'barbell',
    true,
    'uncalibrated'
  ),
  (
    'a0000001-0000-4000-8000-000000000004',
    null,
    'Overhead Press',
    'push',
    'shoulders',
    'barbell',
    true,
    'uncalibrated'
  ),
  (
    'a0000001-0000-4000-8000-000000000005',
    null,
    'Barbell Row',
    'pull',
    'back',
    'barbell',
    true,
    'uncalibrated'
  )
on conflict (id) do nothing;
