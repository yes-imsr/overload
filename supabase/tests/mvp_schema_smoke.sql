-- OVERLOAD-001B: MVP schema smoke checks for supabase test db.

begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

select set_eq(
  $$
    select tablename::text
    from pg_tables
    where schemaname = 'public'
      and tablename in (
        'profiles', 'equipment', 'exercises', 'workout_templates',
        'workout_template_exercises', 'workout_sessions', 'workout_sets',
        'exercise_calibrations', 'game_state', 'game_events', 'nodes', 'user_nodes',
        'debuffs', 'prestige_attempts'
      )
  $$,
  $$
    values
      ('profiles'::text),
      ('equipment'::text),
      ('exercises'::text),
      ('workout_templates'::text),
      ('workout_template_exercises'::text),
      ('workout_sessions'::text),
      ('workout_sets'::text),
      ('exercise_calibrations'::text),
      ('game_state'::text),
      ('game_events'::text),
      ('nodes'::text),
      ('user_nodes'::text),
      ('debuffs'::text),
      ('prestige_attempts'::text)
  $$,
  'MVP persistence tables exist'
);

select is_empty(
  $$
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'profiles', 'equipment', 'exercises', 'workout_templates',
        'workout_template_exercises', 'workout_sessions', 'workout_sets',
        'exercise_calibrations', 'game_state', 'game_events', 'nodes', 'user_nodes',
        'debuffs', 'prestige_attempts'
      )
      and c.relrowsecurity = false
  $$,
  'RLS is enabled on all MVP persistence tables'
);

select cmp_ok(
  (
    select count(*)::integer
    from public.exercises
    where is_builtin = true and user_id is null
  ),
  '>=',
  1,
  'built-in exercises are seeded'
);

select is_empty(
  $$
    with expected(tablename) as (
      values
        ('profiles'),
        ('equipment'),
        ('exercises'),
        ('workout_templates'),
        ('workout_template_exercises'),
        ('workout_sessions'),
        ('workout_sets'),
        ('exercise_calibrations'),
        ('game_state'),
        ('game_events'),
        ('nodes'),
        ('user_nodes'),
        ('debuffs'),
        ('prestige_attempts')
    )
    select e.tablename
    from expected e
    left join pg_policies p
      on p.schemaname = 'public'
      and p.tablename = e.tablename
    group by e.tablename
    having count(p.policyname) = 0
  $$,
  'MVP persistence tables have RLS policies'
);

select has_column(
  'public',
  'workout_template_exercises',
  'last_progression_action',
  'template exercise rows persist last progression action'
);

select has_column(
  'public',
  'workout_template_exercises',
  'last_progression_reason_code',
  'template exercise rows persist last progression reason'
);

select has_column(
  'public',
  'workout_template_exercises',
  'last_progression_source_session_id',
  'template exercise rows link progression source session'
);

select has_column(
  'public',
  'workout_template_exercises',
  'last_progression_applied_at',
  'template exercise rows persist progression applied timestamp'
);

select * from finish();

rollback;
