-- OVERLOAD-001B: manual smoke checks (run after supabase db reset)
-- Usage: supabase db execute --file supabase/tests/mvp_schema_smoke.sql
-- Or paste sections into Supabase Studio SQL editor.

-- 1. Tables exist
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles', 'equipment', 'exercises', 'workout_templates',
    'workout_sessions', 'workout_sets', 'game_state', 'game_events',
    'debuffs', 'prestige_attempts'
  )
order by tablename;

-- 2. RLS enabled on all MVP tables
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles', 'equipment', 'exercises', 'workout_templates',
    'workout_sessions', 'workout_sets', 'game_state', 'game_events',
    'debuffs', 'prestige_attempts'
  )
order by c.relname;

-- 3. Built-in exercises seeded
select count(*) as builtin_count
from public.exercises
where is_builtin = true and user_id is null;

-- 4. Policy count (expect >= 1 per user-owned table)
select schemaname, tablename, count(*) as policy_count
from pg_policies
where schemaname = 'public'
group by schemaname, tablename
order by tablename;

-- 5. OVR-16: profiles + equipment policies present
select tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'equipment')
order by tablename, policyname;
