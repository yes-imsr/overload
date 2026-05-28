begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

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
    '00000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'owner@example.test',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{}'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'other@example.test',
    '',
    now(),
    now(),
    now(),
    '{}',
    '{}'
  );

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'equipment', 'equipment table exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.equipment'::regclass),
  'equipment has RLS enabled'
);

select is_empty(
  $$
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('profiles', 'equipment')
      and column_name ~ '(friend|squad|leaderboard|tournament|nutrition|calorie|macro|protein|subscription|store|photo|social)'
  $$,
  'profile and equipment schema excludes deferred social and nutrition fields'
);

set local role authenticated;

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000001',
    true
  );
  perform set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',
    true
  );
end;
$$;

insert into public.profiles (
  id,
  display_name,
  training_experience,
  training_focus,
  training_days_per_week,
  onboarding_status
) values (
  '00000000-0000-4000-8000-000000000001',
  'Owner',
  'new',
  'strength',
  3,
  'equipment_complete'
);

insert into public.equipment (
  user_id,
  name,
  equipment_type,
  weight_unit,
  min_weight,
  max_weight,
  increment
) values (
  '00000000-0000-4000-8000-000000000001',
  'Barbell',
  'barbell',
  'lb',
  45,
  405,
  5
);

select results_eq(
  $$ select count(*) from public.profiles $$,
  $$ values (1::bigint) $$,
  'owner can select their own profile'
);

select results_eq(
  $$ select count(*) from public.equipment $$,
  $$ values (1::bigint) $$,
  'owner can select their own equipment'
);

select lives_ok(
  $$
    update public.profiles
    set training_focus = 'general'
    where id = '00000000-0000-4000-8000-000000000001'
  $$,
  'owner can update their own profile'
);

select lives_ok(
  $$
    update public.equipment
    set increment = 2.5
    where user_id = '00000000-0000-4000-8000-000000000001'
      and name = 'Barbell'
  $$,
  'owner can update their own equipment'
);

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000002',
    true
  );
  perform set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',
    true
  );
end;
$$;

select results_eq(
  $$ select count(*) from public.profiles $$,
  $$ values (0::bigint) $$,
  'non-owner cannot select another user profile'
);

select results_eq(
  $$ select count(*) from public.equipment $$,
  $$ values (0::bigint) $$,
  'non-owner cannot select another user equipment'
);

select throws_ok(
  $$
    insert into public.equipment (user_id, name, equipment_type)
    values (
      '00000000-0000-4000-8000-000000000001',
      'Cable Stack',
      'cable'
    )
  $$,
  '42501',
  'non-owner cannot insert equipment for another user'
);

reset role;

select * from finish();

rollback;
