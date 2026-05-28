begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) values
  (
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'workout-owner@example.test',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{}'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'workout-other@example.test',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{}'
  );

select has_table(
  'public',
  'workout_template_exercises',
  'workout_template_exercises table exists'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.workout_template_exercises'::regclass
  ),
  'workout_template_exercises has RLS enabled'
);

set local role authenticated;

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '10000000-0000-4000-8000-000000000001',
    true
  );
  perform set_config(
    'request.jwt.claims',
    '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
    true
  );
end;
$$;

insert into public.exercises (
  id,
  user_id,
  name,
  movement_pattern,
  equipment_type,
  is_builtin
) values (
  '10000000-0000-4000-8000-000000000101',
  '10000000-0000-4000-8000-000000000001',
  'Owner Test Press',
  'push',
  'barbell',
  false
);

insert into public.equipment (
  id,
  user_id,
  name,
  equipment_type
) values (
  '10000000-0000-4000-8000-000000000201',
  '10000000-0000-4000-8000-000000000001',
  'Owner Test Barbell',
  'barbell'
);

insert into public.workout_templates (
  id,
  user_id,
  name
) values (
  '10000000-0000-4000-8000-000000000301',
  '10000000-0000-4000-8000-000000000001',
  'Owner Template'
);

select lives_ok(
  $$
    insert into public.workout_template_exercises (
      id,
      template_id,
      user_id,
      exercise_id,
      equipment_id,
      exercise_order,
      target_sets,
      target_reps_min,
      target_reps_max
    ) values (
      '10000000-0000-4000-8000-000000000401',
      '10000000-0000-4000-8000-000000000301',
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000101',
      '10000000-0000-4000-8000-000000000201',
      1,
      3,
      5,
      8
    )
  $$,
  'owner can insert a template exercise for their template'
);

select results_eq(
  $$ select count(*) from public.workout_template_exercises $$,
  $$ values (1::bigint) $$,
  'owner can select their own workout template exercises'
);

insert into public.workout_sessions (
  id,
  user_id,
  template_id,
  status,
  started_at
) values (
  '10000000-0000-4000-8000-000000000501',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000301',
  'draft',
  now()
);

insert into public.workout_sets (
  id,
  session_id,
  user_id,
  exercise_id,
  equipment_id,
  set_order,
  reps
) values (
  '10000000-0000-4000-8000-000000000601',
  '10000000-0000-4000-8000-000000000501',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000101',
  '10000000-0000-4000-8000-000000000201',
  1,
  5
);

select results_eq(
  $$ select count(*) from public.workout_sessions $$,
  $$ values (1::bigint) $$,
  'owner can select their own draft workout session'
);

select lives_ok(
  $$
    update public.workout_sessions
    set status = 'in_progress'
    where id = '10000000-0000-4000-8000-000000000501'
  $$,
  'owner can update an active draft workout session'
);

select lives_ok(
  $$
    update public.workout_sets
    set reps = 6
    where id = '10000000-0000-4000-8000-000000000601'
  $$,
  'owner can update an incomplete set on an active workout session'
);

reset role;

insert into public.workout_sessions (
  id,
  user_id,
  template_id,
  status,
  started_at,
  completed_at,
  source,
  total_volume,
  power_awarded,
  credits_awarded
) values (
  '10000000-0000-4000-8000-000000000502',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000301',
  'completed',
  now(),
  now(),
  'mobile',
  100,
  10,
  5
);

insert into public.workout_sets (
  id,
  session_id,
  user_id,
  exercise_id,
  equipment_id,
  set_order,
  reps,
  is_completed,
  completed_at
) values (
  '10000000-0000-4000-8000-000000000602',
  '10000000-0000-4000-8000-000000000502',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000101',
  '10000000-0000-4000-8000-000000000201',
  1,
  5,
  true,
  now()
);

set local role authenticated;

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '10000000-0000-4000-8000-000000000001',
    true
  );
  perform set_config(
    'request.jwt.claims',
    '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
    true
  );
end;
$$;

select results_eq(
  $$
    with changed as (
      update public.workout_sessions
      set source = 'import'
      where id = '10000000-0000-4000-8000-000000000502'
      returning 1
    )
    select count(*)::bigint from changed
  $$,
  $$ values (0::bigint) $$,
  'owner cannot directly update a completed workout session'
);

select results_eq(
  $$
    with deleted as (
      delete from public.workout_sessions
      where id = '10000000-0000-4000-8000-000000000502'
      returning 1
    )
    select count(*)::bigint from deleted
  $$,
  $$ values (0::bigint) $$,
  'owner cannot directly delete a completed workout session'
);

select results_eq(
  $$
    with changed as (
      update public.workout_sets
      set reps = 7
      where id = '10000000-0000-4000-8000-000000000602'
      returning 1
    )
    select count(*)::bigint from changed
  $$,
  $$ values (0::bigint) $$,
  'owner cannot directly update a completed workout set'
);

select results_eq(
  $$
    with deleted as (
      delete from public.workout_sets
      where id = '10000000-0000-4000-8000-000000000602'
      returning 1
    )
    select count(*)::bigint from deleted
  $$,
  $$ values (0::bigint) $$,
  'owner cannot directly delete a completed workout set'
);

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '10000000-0000-4000-8000-000000000002',
    true
  );
  perform set_config(
    'request.jwt.claims',
    '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',
    true
  );
end;
$$;

select results_eq(
  $$ select count(*) from public.workout_templates $$,
  $$ values (0::bigint) $$,
  'non-owner cannot select another user workout templates'
);

select results_eq(
  $$ select count(*) from public.workout_template_exercises $$,
  $$ values (0::bigint) $$,
  'non-owner cannot select another user workout template exercises'
);

select results_eq(
  $$ select count(*) from public.workout_sessions $$,
  $$ values (0::bigint) $$,
  'non-owner cannot select another user workout sessions'
);

select results_eq(
  $$ select count(*) from public.workout_sets $$,
  $$ values (0::bigint) $$,
  'non-owner cannot select another user workout sets'
);

select results_eq(
  $$
    with changed as (
      update public.workout_sessions
      set status = 'abandoned', abandoned_at = now()
      where id = '10000000-0000-4000-8000-000000000501'
      returning 1
    )
    select count(*)::bigint from changed
  $$,
  $$ values (0::bigint) $$,
  'non-owner cannot update another user draft workout session'
);

select throws_ok(
  $$
    insert into public.workout_sessions (
      id,
      user_id,
      status
    ) values (
      '10000000-0000-4000-8000-000000000503',
      '10000000-0000-4000-8000-000000000001',
      'draft'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "workout_sessions"',
  'non-owner cannot insert a workout session for another user'
);

reset role;

select * from finish();

rollback;
