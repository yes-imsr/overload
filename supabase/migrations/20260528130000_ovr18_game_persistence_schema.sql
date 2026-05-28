-- OVR-18: MVP game persistence schema
--
-- Adds per-user exercise calibration state plus the smallest durable node
-- economy needed by the MVP loop. Existing game_state, game_events, debuffs,
-- and prestige_attempts rows remain server-owned and client-readable only.

-- ---------------------------------------------------------------------------
-- exercise_calibrations (per-user/per-exercise calibration state)
-- ---------------------------------------------------------------------------
create table public.exercise_calibrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  calibration_status text not null default 'uncalibrated'
    check (calibration_status in ('uncalibrated', 'provisional', 'calibrated', 'stale')),
  estimated_1rm numeric(10, 2)
    check (estimated_1rm is null or estimated_1rm >= 0),
  sample_count int not null default 0
    check (sample_count >= 0),
  last_workout_session_id uuid references public.workout_sessions (id),
  calibrated_at timestamptz,
  stale_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_calibrations_status_timestamp_check
    check (
      (calibration_status <> 'calibrated' or calibrated_at is not null)
      and (calibration_status <> 'stale' or stale_at is not null)
    )
);

create unique index exercise_calibrations_user_exercise_unique
  on public.exercise_calibrations (user_id, exercise_id);

create index exercise_calibrations_user_status_idx
  on public.exercise_calibrations (user_id, calibration_status);

create index exercise_calibrations_exercise_id_idx
  on public.exercise_calibrations (exercise_id);

create trigger exercise_calibrations_set_updated_at
  before update on public.exercise_calibrations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- nodes (tiny MVP node catalog; no tree/dependency graph)
-- ---------------------------------------------------------------------------
create table public.nodes (
  id uuid primary key default gen_random_uuid(),
  node_key text not null unique,
  name text not null,
  description text not null,
  node_type text not null
    check (node_type in ('idle_rate_bonus')),
  max_level int not null default 1
    check (max_level >= 1 and max_level <= 3),
  base_credit_cost numeric(14, 2) not null
    check (base_credit_cost >= 0),
  cost_growth numeric(8, 4) not null default 1
    check (cost_growth >= 1),
  effect_value numeric(12, 4) not null
    check (effect_value >= 0),
  sort_order int not null unique
    check (sort_order >= 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index nodes_active_sort_idx
  on public.nodes (is_active, sort_order);

comment on table public.nodes is
  'Tiny MVP node catalog only. Standalone rows; no complex node tree or dependencies.';

-- ---------------------------------------------------------------------------
-- user_nodes (per-user purchased node levels; server-owned writes)
-- ---------------------------------------------------------------------------
create table public.user_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  node_id uuid not null references public.nodes (id),
  level int not null default 0
    check (level >= 0),
  total_credits_spent numeric(14, 2) not null default 0
    check (total_credits_spent >= 0),
  purchased_at timestamptz,
  upgraded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_nodes_purchase_timestamp_check
    check (
      (level = 0 and purchased_at is null)
      or (level > 0 and purchased_at is not null)
    )
);

create unique index user_nodes_user_node_unique
  on public.user_nodes (user_id, node_id);

create index user_nodes_user_id_idx
  on public.user_nodes (user_id);

create index user_nodes_node_id_idx
  on public.user_nodes (node_id);

create trigger user_nodes_set_updated_at
  before update on public.user_nodes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Game event scope needed to audit calibration and node economy changes
-- ---------------------------------------------------------------------------
alter table public.game_events
  drop constraint game_events_event_type_check;

alter table public.game_events
  add constraint game_events_event_type_check
  check (event_type in (
    'workout_completed',
    'calibration_updated',
    'power_awarded',
    'credits_claimed',
    'node_purchased',
    'node_upgraded',
    'debuff_assigned',
    'debuff_revealed',
    'debuff_resolved',
    'prestige_attempt_started',
    'prestige_succeeded',
    'prestige_failed',
    'correction_applied'
  ));

alter table public.game_events
  drop constraint game_events_source_type_check;

alter table public.game_events
  add constraint game_events_source_type_check
  check (source_type in (
    'workout_session',
    'exercise_calibration',
    'user_node',
    'debuff',
    'prestige_attempt',
    'system',
    'manual_correction'
  ));

-- ---------------------------------------------------------------------------
-- Prestige attempt recovery/idempotency
-- ---------------------------------------------------------------------------
alter table public.prestige_attempts
  add column client_attempt_key text,
  add column updated_at timestamptz not null default now(),
  add constraint prestige_attempts_completed_at_check
    check (
      (status = 'started' and completed_at is null)
      or (status in ('succeeded', 'failed', 'cancelled') and completed_at is not null)
    );

create unique index prestige_attempts_client_key_unique
  on public.prestige_attempts (user_id, client_attempt_key)
  where client_attempt_key is not null;

create unique index prestige_attempts_one_started_per_user_idx
  on public.prestige_attempts (user_id)
  where status = 'started';

create trigger prestige_attempts_set_updated_at
  before update on public.prestige_attempts
  for each row execute function public.set_updated_at();

comment on index public.prestige_attempts_one_started_per_user_idx is
  'Allows the app to recover one in-flight MVP prestige attempt after restart.';

-- ---------------------------------------------------------------------------
-- Ownership and consistency triggers for server-written game rows
-- ---------------------------------------------------------------------------
create or replace function public.enforce_exercise_calibration_consistency()
returns trigger
language plpgsql
as $$
declare
  exercise_owner uuid;
  session_owner uuid;
begin
  select e.user_id into exercise_owner
  from public.exercises e
  where e.id = new.exercise_id;

  if not found then
    raise exception 'exercise % not found', new.exercise_id;
  end if;

  if exercise_owner is not null and exercise_owner is distinct from new.user_id then
    raise exception 'exercise_calibrations.exercise_id must reference a built-in exercise or an exercise owned by user_id';
  end if;

  if new.last_workout_session_id is not null then
    select ws.user_id into session_owner
    from public.workout_sessions ws
    where ws.id = new.last_workout_session_id;

    if session_owner is null then
      raise exception 'workout session % not found', new.last_workout_session_id;
    end if;

    if session_owner is distinct from new.user_id then
      raise exception 'exercise_calibrations.last_workout_session_id must match user_id';
    end if;
  end if;

  return new;
end;
$$;

create trigger exercise_calibrations_enforce_consistency
  before insert or update on public.exercise_calibrations
  for each row execute function public.enforce_exercise_calibration_consistency();

create or replace function public.enforce_user_node_level()
returns trigger
language plpgsql
as $$
declare
  node_max_level int;
begin
  select n.max_level into node_max_level
  from public.nodes n
  where n.id = new.node_id;

  if node_max_level is null then
    raise exception 'node % not found', new.node_id;
  end if;

  if new.level > node_max_level then
    raise exception 'user_nodes.level exceeds nodes.max_level';
  end if;

  return new;
end;
$$;

create trigger user_nodes_enforce_level
  before insert or update on public.user_nodes
  for each row execute function public.enforce_user_node_level();

create or replace function public.enforce_game_state_debuff_consistency()
returns trigger
language plpgsql
as $$
declare
  debuff_owner uuid;
begin
  if new.current_debuff_id is null then
    return new;
  end if;

  select d.user_id into debuff_owner
  from public.debuffs d
  where d.id = new.current_debuff_id;

  if debuff_owner is null then
    raise exception 'debuff % not found', new.current_debuff_id;
  end if;

  if debuff_owner is distinct from new.user_id then
    raise exception 'game_state.current_debuff_id must match user_id';
  end if;

  return new;
end;
$$;

create trigger game_state_enforce_debuff_consistency
  before insert or update on public.game_state
  for each row execute function public.enforce_game_state_debuff_consistency();

create or replace function public.enforce_debuff_user_consistency()
returns trigger
language plpgsql
as $$
declare
  source_owner uuid;
  resolution_owner uuid;
begin
  if new.source_session_id is not null then
    select ws.user_id into source_owner
    from public.workout_sessions ws
    where ws.id = new.source_session_id;

    if source_owner is null then
      raise exception 'workout session % not found', new.source_session_id;
    end if;

    if source_owner is distinct from new.user_id then
      raise exception 'debuffs.source_session_id must match user_id';
    end if;
  end if;

  if new.resolution_session_id is not null then
    select ws.user_id into resolution_owner
    from public.workout_sessions ws
    where ws.id = new.resolution_session_id;

    if resolution_owner is null then
      raise exception 'workout session % not found', new.resolution_session_id;
    end if;

    if resolution_owner is distinct from new.user_id then
      raise exception 'debuffs.resolution_session_id must match user_id';
    end if;
  end if;

  return new;
end;
$$;

create trigger debuffs_enforce_user_consistency
  before insert or update on public.debuffs
  for each row execute function public.enforce_debuff_user_consistency();

create or replace function public.enforce_prestige_attempt_user_consistency()
returns trigger
language plpgsql
as $$
declare
  exercise_owner uuid;
  session_owner uuid;
begin
  if new.target_exercise_id is not null then
    select e.user_id into exercise_owner
    from public.exercises e
    where e.id = new.target_exercise_id;

    if not found then
      raise exception 'exercise % not found', new.target_exercise_id;
    end if;

    if exercise_owner is not null and exercise_owner is distinct from new.user_id then
      raise exception 'prestige_attempts.target_exercise_id must reference a built-in exercise or an exercise owned by user_id';
    end if;
  end if;

  if new.source_session_id is not null then
    select ws.user_id into session_owner
    from public.workout_sessions ws
    where ws.id = new.source_session_id;

    if session_owner is null then
      raise exception 'workout session % not found', new.source_session_id;
    end if;

    if session_owner is distinct from new.user_id then
      raise exception 'prestige_attempts.source_session_id must match user_id';
    end if;
  end if;

  return new;
end;
$$;

create trigger prestige_attempts_enforce_user_consistency
  before insert or update on public.prestige_attempts
  for each row execute function public.enforce_prestige_attempt_user_consistency();

-- ---------------------------------------------------------------------------
-- RLS: user-owned game rows are owner-readable and server-written.
-- ---------------------------------------------------------------------------
alter table public.exercise_calibrations enable row level security;

create policy exercise_calibrations_select_own
  on public.exercise_calibrations for select
  using (auth.uid() = user_id);

alter table public.nodes enable row level security;

create policy nodes_select_active
  on public.nodes for select
  using (is_active = true);

alter table public.user_nodes enable row level security;

create policy user_nodes_select_own
  on public.user_nodes for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Tiny MVP node seed data only: two standalone idle-rate nodes, no tree.
-- ---------------------------------------------------------------------------
insert into public.nodes (
  id,
  node_key,
  name,
  description,
  node_type,
  max_level,
  base_credit_cost,
  cost_growth,
  effect_value,
  sort_order,
  is_active
)
values
  (
    'b0000001-0000-4000-8000-000000000001',
    'power_core',
    'Power Core',
    'Small increase to the Credits claim rate generated from Power.',
    'idle_rate_bonus',
    3,
    100,
    1.5000,
    0.0500,
    1,
    true
  ),
  (
    'b0000001-0000-4000-8000-000000000002',
    'credit_capacitor',
    'Credit Capacitor',
    'Second MVP upgrade for the same Credits claim loop.',
    'idle_rate_bonus',
    2,
    250,
    2.0000,
    0.1000,
    2,
    true
  )
on conflict (node_key) do nothing;
