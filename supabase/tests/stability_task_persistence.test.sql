begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

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
) values (
  '00000000-0000-4000-8000-000000000034',
  'authenticated',
  'authenticated',
  'stability-task-owner@example.test',
  '',
  now(),
  now(),
  now(),
  '{}',
  '{}'
);

insert into public.profiles (id, display_name, training_experience, onboarding_status)
values (
  '00000000-0000-4000-8000-000000000034',
  'Stability Owner',
  'new',
  'complete'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'debuffs'
      and indexname = 'debuffs_one_open_stability_task_per_user'
  ),
  'debuffs enforce one open Stability Task per user'
);

insert into public.debuffs (user_id, debuff_type, status)
values (
  '00000000-0000-4000-8000-000000000034',
  'power_gain_reduction',
  'active'
);

select throws_ok(
  $$
    insert into public.debuffs (user_id, debuff_type, status)
    values (
      '00000000-0000-4000-8000-000000000034',
      'power_gain_reduction',
      'pending_reveal'
    )
  $$,
  '23505',
  'duplicate key value violates unique constraint "debuffs_one_open_stability_task_per_user"',
  'duplicate open Stability Tasks are rejected'
);

update public.debuffs
set status = 'resolved', resolved_at = now()
where user_id = '00000000-0000-4000-8000-000000000034';

select lives_ok(
  $$
    insert into public.debuffs (user_id, debuff_type, status)
    values (
      '00000000-0000-4000-8000-000000000034',
      'power_gain_reduction',
      'pending_reveal'
    )
  $$,
  'a resolved Stability Task allows a later MVP task'
);

select results_eq(
  $$
    select count(*)
    from public.debuffs
    where user_id = '00000000-0000-4000-8000-000000000034'
      and status in ('pending_reveal', 'active')
  $$,
  $$ values (1::bigint) $$,
  'only one open Stability Task remains'
);

select * from finish();

rollback;
