begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

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
    '00000000-0000-4000-8000-000000000010',
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
    '00000000-0000-4000-8000-000000000011',
    'authenticated',
    'authenticated',
    'workout-other@example.test',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{}'
  )
on conflict (id) do nothing;

select has_table('public', 'exercises', 'exercises table exists');
select has_table('public', 'workout_templates', 'workout_templates table exists');
select has_table(
  'public',
  'workout_template_exercises',
  'workout_template_exercises table exists'
);
select has_table('public', 'workout_sessions', 'workout_sessions table exists');
select has_table('public', 'workout_sets', 'workout_sets table exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.workout_sessions'::regclass),
  'workout_sessions has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.workout_sets'::regclass),
  'workout_sets has RLS enabled'
);

set local role authenticated;

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000010',
    true
  );
  perform set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000010","role":"authenticated"}',
    true
  );
end;
$$;

insert into public.profiles (
  id,
  display_name,
  training_experience,
  onboarding_status
) values (
  '00000000-0000-4000-8000-000000000010',
  'Workout Owner',
  'new',
  'equipment_complete'
) on conflict (id) do nothing;

insert into public.workout_templates (user_id, name, status)
values (
  '00000000-0000-4000-8000-000000000010',
  'Push Day',
  'active'
);

insert into public.workout_template_exercises (
  template_id,
  user_id,
  exercise_id,
  sort_order,
  target_sets,
  target_rep_min,
  target_rep_max
)
select
  wt.id,
  wt.user_id,
  e.id,
  1,
  3,
  6,
  10
from public.workout_templates wt
cross join lateral (
  select id
  from public.exercises
  where is_builtin = true
  limit 1
) e
where wt.user_id = '00000000-0000-4000-8000-000000000010'
  and wt.name = 'Push Day';

insert into public.workout_sessions (id, user_id, status, started_at)
values (
  '10000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000010',
  'draft',
  now()
);

insert into public.workout_sets (
  session_id,
  user_id,
  exercise_id,
  set_order,
  weight,
  reps
)
select
  ws.id,
  ws.user_id,
  e.id,
  1,
  135,
  8
from public.workout_sessions ws
cross join lateral (
  select id
  from public.exercises
  where is_builtin = true
  limit 1
) e
where ws.user_id = '00000000-0000-4000-8000-000000000010'
  and ws.status = 'draft';

select lives_ok(
  $$
    update public.workout_sessions
    set started_at = now() - interval '5 minutes'
    where user_id = '00000000-0000-4000-8000-000000000010'
      and status = 'draft'
  $$,
  'owner can update draft workout session'
);

select lives_ok(
  $$
    update public.workout_sets ws
    set weight = 140
    from public.workout_sessions s
    where ws.session_id = s.id
      and s.user_id = '00000000-0000-4000-8000-000000000010'
      and s.status = 'draft'
      and ws.is_completed = false
  $$,
  'owner can update sets on draft session'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000010","role":"service_role"}',
  true
);

reset role;

update public.workout_sessions
set
  status = 'completed',
  completed_at = now(),
  total_volume = 1080,
  power_awarded = 12,
  credits_awarded = 3
where id = '10000000-0000-4000-8000-000000000010';

set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000010',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000010","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    update public.workout_sessions
    set started_at = now()
    where user_id = '00000000-0000-4000-8000-000000000010'
      and status = 'completed'
  $$,
  'P0001',
  'completed workout sessions are immutable',
  'owner cannot update completed workout session'
);

select throws_ok(
  $$
    update public.workout_sets ws
    set weight = 145
    from public.workout_sessions s
    where ws.session_id = s.id
      and s.status = 'completed'
  $$,
  'P0001',
  'sets on completed sessions are immutable',
  'owner cannot update sets on completed session'
);

select throws_ok(
  $$
    delete from public.workout_sessions
    where user_id = '00000000-0000-4000-8000-000000000010'
      and status = 'completed'
  $$,
  'P0001',
  'completed workout sessions cannot be deleted',
  'owner cannot delete completed workout session'
);

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000011',
    true
  );
  perform set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000011","role":"authenticated"}',
    true
  );
end;
$$;

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

select throws_ok(
  $$
    insert into public.workout_sessions (user_id, status, started_at)
    values (
      '00000000-0000-4000-8000-000000000010',
      'draft',
      now()
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "workout_sessions"',
  'non-owner cannot insert another user workout session'
);

select throws_ok(
  $$
    insert into public.workout_sets (
      session_id,
      user_id,
      exercise_id,
      set_order,
      weight,
      reps
    )
    select
      '10000000-0000-4000-8000-000000000010',
      '00000000-0000-4000-8000-000000000011',
      e.id,
      99,
      50,
      5
    from public.exercises e
    where e.is_builtin = true
    limit 1
  $$,
  'P0001',
  null,
  'non-owner cannot insert sets on another user session'
);

reset role;

select * from finish();

rollback;
