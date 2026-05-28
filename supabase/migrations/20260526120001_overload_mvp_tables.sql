-- OVERLOAD-001B: MVP tables
-- Architecture: docs/architecture/ARCHON_ARCHITECTURE.md

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  training_experience text not null default 'new'
    check (training_experience in ('new', 'intermediate', 'advanced')),
  height_cm numeric(5, 2),
  weight_kg numeric(6, 2),
  birth_year int
    check (birth_year is null or (birth_year >= 1900 and birth_year <= extract(year from now())::int)),
  sex text
    check (sex is null or sex in ('male', 'female', 'other', 'prefer_not_to_say')),
  onboarding_status text not null default 'not_started'
    check (onboarding_status in (
      'not_started',
      'profile_complete',
      'equipment_complete',
      'calibration_started',
      'complete'
    )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- equipment
-- ---------------------------------------------------------------------------
create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  equipment_type text not null
    check (equipment_type in ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other')),
  weight_unit text not null default 'lb'
    check (weight_unit in ('lb', 'kg')),
  min_weight numeric(7, 2),
  max_weight numeric(7, 2),
  increment numeric(7, 2),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equipment_increment_positive
    check (increment is null or increment > 0),
  constraint equipment_weight_range
    check (
      min_weight is null
      or max_weight is null
      or max_weight >= min_weight
    )
);

create unique index equipment_user_name_unique
  on public.equipment (user_id, lower(name));

create index equipment_user_id_idx on public.equipment (user_id);
create index equipment_user_available_idx on public.equipment (user_id, is_available);

create trigger equipment_set_updated_at
  before update on public.equipment
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- exercises (built-in catalog + user custom)
-- ---------------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  name text not null,
  movement_pattern text
    check (movement_pattern is null or movement_pattern in (
      'push', 'pull', 'squat', 'hinge', 'carry', 'core', 'isolation', 'other'
    )),
  primary_muscle_group text,
  equipment_type text
    check (equipment_type is null or equipment_type in (
      'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'
    )),
  is_builtin boolean not null default false,
  calibration_status text not null default 'uncalibrated'
    check (calibration_status in ('uncalibrated', 'provisional', 'calibrated', 'stale')),
  calibrated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_builtin_user_check
    check (
      (is_builtin = true and user_id is null)
      or (is_builtin = false and user_id is not null)
    )
);

create index exercises_user_id_idx on public.exercises (user_id);
create index exercises_is_builtin_idx on public.exercises (is_builtin);
create index exercises_user_calibration_idx
  on public.exercises (user_id, calibration_status)
  where user_id is not null;

create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workout_templates
-- ---------------------------------------------------------------------------
create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active'
    check (status in ('draft', 'active', 'archived')),
  template_version int not null default 1
    check (template_version >= 1),
  planned_exercises jsonb not null default '[]'::jsonb,
  created_from_template_id uuid references public.workout_templates (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_templates_user_status_idx
  on public.workout_templates (user_id, status);

create trigger workout_templates_set_updated_at
  before update on public.workout_templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workout_sessions
-- ---------------------------------------------------------------------------
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  template_id uuid references public.workout_templates (id),
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'completed', 'abandoned', 'corrected')),
  started_at timestamptz,
  completed_at timestamptz,
  abandoned_at timestamptz,
  source text not null default 'mobile'
    check (source in ('mobile', 'edge_function', 'import')),
  client_session_key text,
  total_volume numeric(12, 2),
  power_awarded numeric(12, 2),
  credits_awarded numeric(12, 2),
  completion_version int not null default 1
    check (completion_version >= 1),
  corrected_by_session_id uuid references public.workout_sessions (id),
  correction_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_sessions_completed_at_check
    check (
      (status = 'completed' and completed_at is not null)
      or status <> 'completed'
    ),
  constraint workout_sessions_abandoned_at_check
    check (
      (status = 'abandoned' and abandoned_at is not null)
      or status <> 'abandoned'
    )
);

create unique index workout_sessions_client_key_unique
  on public.workout_sessions (user_id, client_session_key)
  where client_session_key is not null;

create index workout_sessions_user_status_idx on public.workout_sessions (user_id, status);
create index workout_sessions_user_started_idx on public.workout_sessions (user_id, started_at desc);
create index workout_sessions_user_completed_idx on public.workout_sessions (user_id, completed_at desc);
create index workout_sessions_template_id_idx on public.workout_sessions (template_id);

create trigger workout_sessions_set_updated_at
  before update on public.workout_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workout_sets
-- ---------------------------------------------------------------------------
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  equipment_id uuid references public.equipment (id),
  set_order int not null check (set_order >= 1),
  set_type text not null default 'working'
    check (set_type in ('warmup', 'working', 'punishment', 'backoff')),
  weight numeric(8, 2) not null default 0,
  weight_unit text not null default 'lb'
    check (weight_unit in ('lb', 'kg')),
  reps int not null check (reps >= 0 and reps <= 200),
  rpe_label text
    check (rpe_label is null or rpe_label in ('easy', 'medium', 'hard', 'near_death')),
  is_completed boolean not null default false,
  completed_at timestamptz,
  client_set_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_sets_completed_at_check
    check (
      (is_completed = true and completed_at is not null)
      or is_completed = false
    )
);

create unique index workout_sets_session_order_unique
  on public.workout_sets (session_id, set_order);

create unique index workout_sets_client_key_unique
  on public.workout_sets (user_id, client_set_key)
  where client_set_key is not null;

create index workout_sets_user_id_idx on public.workout_sets (user_id);
create index workout_sets_session_id_idx on public.workout_sets (session_id, set_order);
create index workout_sets_exercise_completed_idx
  on public.workout_sets (exercise_id, completed_at desc);

create trigger workout_sets_set_updated_at
  before update on public.workout_sets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- game_state (one row per user; privileged writes)
-- ---------------------------------------------------------------------------
create table public.game_state (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  power_balance numeric(14, 2) not null default 0,
  credits_balance numeric(14, 2) not null default 0,
  entropy numeric(10, 2) not null default 0,
  prestige_level int not null default 0 check (prestige_level >= 0),
  idle_rate numeric(12, 4) not null default 0,
  last_idle_claim_at timestamptz,
  current_debuff_id uuid,
  status text not null default 'active'
    check (status in ('active', 'prestige_locked', 'debuffed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger game_state_set_updated_at
  before update on public.game_state
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- game_events (append-only audit log)
-- ---------------------------------------------------------------------------
create table public.game_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'workout_completed',
      'power_awarded',
      'credits_claimed',
      'debuff_assigned',
      'debuff_revealed',
      'debuff_resolved',
      'prestige_attempt_started',
      'prestige_succeeded',
      'prestige_failed',
      'correction_applied'
    )),
  source_type text not null
    check (source_type in (
      'workout_session', 'debuff', 'prestige_attempt', 'system', 'manual_correction'
    )),
  source_id uuid,
  power_delta numeric(14, 2) not null default 0,
  credits_delta numeric(14, 2) not null default 0,
  entropy_delta numeric(10, 2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index game_events_user_created_idx
  on public.game_events (user_id, created_at desc);
create index game_events_user_type_created_idx
  on public.game_events (user_id, event_type, created_at desc);
create index game_events_source_idx
  on public.game_events (source_type, source_id);

-- ---------------------------------------------------------------------------
-- debuffs (MVP: power_gain_reduction only)
-- ---------------------------------------------------------------------------
create table public.debuffs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  debuff_type text not null default 'power_gain_reduction'
    check (debuff_type in ('power_gain_reduction')),
  status text not null default 'pending_reveal'
    check (status in ('pending_reveal', 'active', 'resolved', 'expired')),
  assigned_at timestamptz not null default now(),
  revealed_at timestamptz,
  resolved_at timestamptz,
  expires_at timestamptz,
  source_session_id uuid references public.workout_sessions (id),
  resolution_session_id uuid references public.workout_sessions (id),
  effect_value numeric(8, 4) not null default 0.15,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index debuffs_user_status_idx on public.debuffs (user_id, status);
create index debuffs_user_assigned_idx on public.debuffs (user_id, assigned_at desc);

create trigger debuffs_set_updated_at
  before update on public.debuffs
  for each row execute function public.set_updated_at();

-- FK from game_state to debuffs (deferred until debuffs exists)
alter table public.game_state
  add constraint game_state_current_debuff_id_fkey
  foreign key (current_debuff_id) references public.debuffs (id);

-- ---------------------------------------------------------------------------
-- prestige_attempts
-- ---------------------------------------------------------------------------
create table public.prestige_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'started'
    check (status in ('started', 'succeeded', 'failed', 'cancelled')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  required_credits numeric(14, 2) not null,
  credits_at_attempt numeric(14, 2) not null,
  target_exercise_id uuid references public.exercises (id),
  target_metric text not null
    check (target_metric in ('estimated_1rm', 'rep_pr')),
  target_value numeric(10, 2) not null,
  achieved_value numeric(10, 2),
  source_session_id uuid references public.workout_sessions (id),
  credit_penalty numeric(14, 2) not null default 0,
  lockout_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index prestige_attempts_user_status_idx
  on public.prestige_attempts (user_id, status);
create index prestige_attempts_user_started_idx
  on public.prestige_attempts (user_id, started_at desc);
