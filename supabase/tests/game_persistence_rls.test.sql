begin;

create extension if not exists pgtap with schema extensions;

select plan(36);

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

select has_table('public', 'exercise_calibrations', 'exercise_calibrations table exists');
select has_table('public', 'game_state', 'game_state table exists');
select has_table('public', 'game_events', 'game_events table exists');
select has_table('public', 'nodes', 'nodes table exists');
select has_table('public', 'user_nodes', 'user_nodes table exists');
select has_table('public', 'debuffs', 'debuffs table exists');
select has_table('public', 'prestige_attempts', 'prestige_attempts table exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.exercise_calibrations'::regclass),
  'exercise_calibrations has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.game_state'::regclass),
  'game_state has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.game_events'::regclass),
  'game_events has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.nodes'::regclass),
  'nodes has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.user_nodes'::regclass),
  'user_nodes has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.debuffs'::regclass),
  'debuffs has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.prestige_attempts'::regclass),
  'prestige_attempts has RLS enabled'
);

select ok(
  (select count(*) between 1 and 2 from public.nodes where is_active = true),
  'node seed data stays tiny for MVP'
);

select is_empty(
  $$
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('nodes', 'user_nodes')
      and column_name ~ '(parent|dependency|tree|branch|squad|leaderboard|tournament|cosmetic)'
  $$,
  'node schema excludes complex trees and deferred systems'
);

do $$
begin
  perform set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000020","role":"service_role"}',
    true
  );
end;
$$;

insert into public.exercise_calibrations (
  user_id,
  exercise_id,
  calibration_status,
  estimated_1rm,
  sample_count
)
select
  '00000000-0000-4000-8000-000000000020',
  e.id,
  'provisional',
  205,
  2
from public.exercises e
where e.is_builtin = true
order by e.name
limit 1;

insert into public.exercise_calibrations (
  user_id,
  exercise_id,
  calibration_status
)
select
  '00000000-0000-4000-8000-000000000021',
  e.id,
  'uncalibrated'
from public.exercises e
where e.is_builtin = true
order by e.name
limit 1;

insert into public.user_nodes (
  user_id,
  node_id,
  level,
  total_credits_spent,
  purchased_at,
  upgraded_at
)
select
  '00000000-0000-4000-8000-000000000020',
  n.id,
  1,
  n.base_credit_cost,
  now(),
  now()
from public.nodes n
where n.is_active = true
order by n.sort_order
limit 1;

insert into public.user_nodes (
  user_id,
  node_id,
  level,
  total_credits_spent,
  purchased_at,
  upgraded_at
)
select
  '00000000-0000-4000-8000-000000000021',
  n.id,
  1,
  n.base_credit_cost,
  now(),
  now()
from public.nodes n
where n.is_active = true
order by n.sort_order
limit 1;

insert into public.game_events (
  user_id,
  event_type,
  source_type,
  power_delta,
  credits_delta
) values
  (
    '00000000-0000-4000-8000-000000000020',
    'credits_claimed',
    'system',
    0,
    10
  ),
  (
    '00000000-0000-4000-8000-000000000021',
    'credits_claimed',
    'system',
    0,
    5
  );

insert into public.debuffs (
  user_id,
  debuff_type,
  status
) values
  (
    '00000000-0000-4000-8000-000000000020',
    'power_gain_reduction',
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000021',
    'power_gain_reduction',
    'active'
  );

insert into public.prestige_attempts (
  user_id,
  status,
  required_credits,
  credits_at_attempt,
  target_exercise_id,
  target_metric,
  target_value,
  client_attempt_key
)
select
  '00000000-0000-4000-8000-000000000020',
  'started',
  1000,
  1200,
  e.id,
  'estimated_1rm',
  225,
  'owner-prestige-attempt'
from public.exercises e
where e.is_builtin = true
order by e.name
limit 1;

insert into public.prestige_attempts (
  user_id,
  status,
  required_credits,
  credits_at_attempt,
  target_exercise_id,
  target_metric,
  target_value,
  client_attempt_key
)
select
  '00000000-0000-4000-8000-000000000021',
  'started',
  1000,
  1100,
  e.id,
  'estimated_1rm',
  205,
  'other-prestige-attempt'
from public.exercises e
where e.is_builtin = true
order by e.name
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

select results_eq(
  $$ select count(*) from public.game_state where user_id = '00000000-0000-4000-8000-000000000020' $$,
  $$ values (1::bigint) $$,
  'owner can select their own game_state'
);

select results_eq(
  $$ select count(*) from public.exercise_calibrations where user_id = '00000000-0000-4000-8000-000000000020' $$,
  $$ values (1::bigint) $$,
  'owner can select their own exercise calibration'
);

select results_eq(
  $$ select count(*) from public.game_events where user_id = '00000000-0000-4000-8000-000000000020' $$,
  $$ values (1::bigint) $$,
  'owner can select their own game events'
);

select ok(
  (select count(*) between 1 and 2 from public.nodes),
  'authenticated users can select the tiny active node catalog'
);

select results_eq(
  $$ select count(*) from public.user_nodes where user_id = '00000000-0000-4000-8000-000000000020' $$,
  $$ values (1::bigint) $$,
  'owner can select their own node state'
);

select results_eq(
  $$ select count(*) from public.debuffs where user_id = '00000000-0000-4000-8000-000000000020' $$,
  $$ values (1::bigint) $$,
  'owner can select their own debuff'
);

select results_eq(
  $$
    select count(*)
    from public.prestige_attempts
    where user_id = '00000000-0000-4000-8000-000000000020'
      and status = 'started'
      and client_attempt_key = 'owner-prestige-attempt'
  $$,
  $$ values (1::bigint) $$,
  'owner can recover a started prestige attempt'
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
  $$ select count(*) from public.game_state where user_id = '00000000-0000-4000-8000-000000000020' $$,
  $$ values (0::bigint) $$,
  'non-owner cannot select another user game_state'
);

select results_eq(
  $$ select count(*) from public.exercise_calibrations where user_id = '00000000-0000-4000-8000-000000000020' $$,
  $$ values (0::bigint) $$,
  'non-owner cannot select another user exercise calibration'
);

select results_eq(
  $$ select count(*) from public.game_events where user_id = '00000000-0000-4000-8000-000000000020' $$,
  $$ values (0::bigint) $$,
  'non-owner cannot select another user game events'
);

select results_eq(
  $$ select count(*) from public.user_nodes where user_id = '00000000-0000-4000-8000-000000000020' $$,
  $$ values (0::bigint) $$,
  'non-owner cannot select another user node state'
);

select results_eq(
  $$ select count(*) from public.debuffs where user_id = '00000000-0000-4000-8000-000000000020' $$,
  $$ values (0::bigint) $$,
  'non-owner cannot select another user debuffs'
);

select results_eq(
  $$ select count(*) from public.prestige_attempts where user_id = '00000000-0000-4000-8000-000000000020' $$,
  $$ values (0::bigint) $$,
  'non-owner cannot select another user prestige attempts'
);

select throws_ok(
  $$
    insert into public.exercise_calibrations (
      user_id,
      exercise_id,
      calibration_status
    )
    select
      '00000000-0000-4000-8000-000000000020',
      e.id,
      'uncalibrated'
    from public.exercises e
    where e.is_builtin = true
    order by e.name desc
    limit 1
  $$,
  '42501',
  null,
  'non-owner cannot insert another user exercise calibration'
);

select throws_ok(
  $$
    insert into public.user_nodes (
      user_id,
      node_id,
      level,
      total_credits_spent,
      purchased_at
    )
    select
      '00000000-0000-4000-8000-000000000020',
      n.id,
      1,
      n.base_credit_cost,
      now()
    from public.nodes n
    where n.is_active = true
    order by n.sort_order desc
    limit 1
  $$,
  '42501',
  null,
  'non-owner cannot insert another user node state'
);

update public.game_state
set credits_balance = 999
where user_id = '00000000-0000-4000-8000-000000000021';

select results_eq(
  $$ select credits_balance from public.game_state where user_id = '00000000-0000-4000-8000-000000000021' $$,
  $$ values (0::numeric) $$,
  'authenticated user cannot directly update game_state'
);

select throws_ok(
  $$
    insert into public.game_events (
      user_id,
      event_type,
      source_type,
      credits_delta
    ) values (
      '00000000-0000-4000-8000-000000000021',
      'credits_claimed',
      'system',
      1
    )
  $$,
  '42501',
  null,
  'authenticated user cannot directly insert game events'
);

update public.prestige_attempts
set status = 'succeeded', completed_at = now(), achieved_value = 250
where user_id = '00000000-0000-4000-8000-000000000021';

select results_eq(
  $$ select status from public.prestige_attempts where user_id = '00000000-0000-4000-8000-000000000021' $$,
  $$ values ('started'::text) $$,
  'authenticated user cannot directly resolve prestige attempts'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000020","role":"service_role"}',
  true
);

select throws_ok(
  $$
    insert into public.debuffs (
      user_id,
      debuff_type,
      status
    ) values (
      '00000000-0000-4000-8000-000000000020',
      'forced_exercise_lock',
      'active'
    )
  $$,
  '23514',
  null,
  'MVP debuffs reject additional system task types'
);

select throws_ok(
  $$
    insert into public.prestige_attempts (
      user_id,
      status,
      required_credits,
      credits_at_attempt,
      target_metric,
      target_value,
      client_attempt_key
    ) values (
      '00000000-0000-4000-8000-000000000020',
      'started',
      1000,
      1300,
      'estimated_1rm',
      245,
      'duplicate-started-attempt'
    )
  $$,
  '23505',
  null,
  'only one started prestige attempt is recoverable per user'
);

select * from finish();

rollback;
