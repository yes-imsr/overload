begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

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
    '00000000-0000-4000-8000-000000000020',
    'authenticated',
    'authenticated',
    'game-owner@example.test',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{}'
  ),
  (
    '00000000-0000-4000-8000-000000000021',
    'authenticated',
    'authenticated',
    'game-other@example.test',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{}'
  );

select has_table('public', 'exercise_calibrations', 'exercise_calibrations exists');
select has_table('public', 'nodes', 'nodes exists');
select has_table('public', 'user_nodes', 'user_nodes exists');
select has_table('public', 'game_state', 'game_state exists');
select has_table('public', 'game_events', 'game_events exists');
select has_table('public', 'debuffs', 'debuffs exists');
select has_table('public', 'prestige_attempts', 'prestige_attempts exists');

select ok(
  (
    select count(*) = 3
    from public.nodes
    where is_active = true and max_level = 1
  ),
  'MVP node seed is a tiny linear chain without upgrade trees'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'prestige_attempts'
      and indexname = 'prestige_attempts_one_started_per_user'
  ),
  'prestige attempts enforce one in-progress row per user for recovery'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.game_state'::regclass),
  'game_state has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.user_nodes'::regclass),
  'user_nodes has RLS enabled'
);

insert into public.profiles (id, display_name, training_experience, onboarding_status)
values
  ('00000000-0000-4000-8000-000000000020', 'Owner', 'new', 'equipment_complete'),
  ('00000000-0000-4000-8000-000000000021', 'Other', 'new', 'equipment_complete')
on conflict (id) do nothing;

insert into public.user_nodes (user_id, node_id, is_unlocked, level, unlocked_at)
select
  '00000000-0000-4000-8000-000000000020',
  id,
  true,
  1,
  now()
from public.nodes
where slug = 'core-reactor'
limit 1;

set local role authenticated;

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000020',
    true
  );
  perform set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000020","role":"authenticated"}',
    true
  );
end;
$$;

select cmp_ok(
  (select count(*)::integer from public.nodes),
  '>=',
  1,
  'authenticated user can read node catalog'
);

select results_eq(
  $$ select count(*) from public.game_state $$,
  $$ values (1::bigint) $$,
  'owner can read own game_state'
);

select results_eq(
  $$ select count(*) from public.user_nodes $$,
  $$ values (1::bigint) $$,
  'owner can read own user_nodes'
);

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000021',
    true
  );
  perform set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000021","role":"authenticated"}',
    true
  );
end;
$$;

select results_eq(
  $$ select count(*) from public.game_state $$,
  $$ values (0::bigint) $$,
  'non-owner cannot read another user game_state'
);

select results_eq(
  $$ select count(*) from public.user_nodes $$,
  $$ values (0::bigint) $$,
  'non-owner cannot read another user user_nodes'
);

select throws_ok(
  $$
    insert into public.user_nodes (user_id, node_id, is_unlocked)
    select
      '00000000-0000-4000-8000-000000000020',
      id,
      true
    from public.nodes
    limit 1
  $$,
  '42501',
  'new row violates row-level security policy for table "user_nodes"',
  'non-owner cannot insert user_nodes for another user'
);

select is_empty(
  $$
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('nodes', 'user_nodes', 'debuffs')
      and column_name ~ '(friend|squad|leaderboard|tournament|subscription|store|social)'
  $$,
  'game schema excludes deferred social and monetization fields'
);

reset role;

select * from finish();

rollback;
