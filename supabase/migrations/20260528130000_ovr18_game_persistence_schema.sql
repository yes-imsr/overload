-- OVR-18: MVP game persistence (nodes, per-user calibrations, prestige recovery)

-- ---------------------------------------------------------------------------
-- exercise_calibrations (per-user / per-exercise; complements exercises.calibration_status)
-- ---------------------------------------------------------------------------
create table public.exercise_calibrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  calibration_status text not null default 'uncalibrated'
    check (calibration_status in ('uncalibrated', 'provisional', 'calibrated', 'stale')),
  calibrated_at timestamptz,
  last_session_at timestamptz,
  recent_performances jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_calibrations_unique_user_exercise unique (user_id, exercise_id)
);

create index exercise_calibrations_user_status_idx
  on public.exercise_calibrations (user_id, calibration_status);

create index exercise_calibrations_exercise_id_idx
  on public.exercise_calibrations (exercise_id);

create trigger exercise_calibrations_set_updated_at
  before update on public.exercise_calibrations
  for each row execute function public.set_updated_at();

create or replace function public.enforce_exercise_calibration_exercise_ownership()
returns trigger
language plpgsql
as $$
declare
  exercise_owner uuid;
  exercise_is_builtin boolean;
begin
  select e.user_id, e.is_builtin
  into exercise_owner, exercise_is_builtin
  from public.exercises e
  where e.id = new.exercise_id;

  if exercise_is_builtin is null then
    raise exception 'exercise % not found', new.exercise_id;
  end if;

  if exercise_is_builtin = false and new.user_id is distinct from exercise_owner then
    raise exception 'exercise_calibrations.user_id must match custom exercise owner';
  end if;

  return new;
end;
$$;

create trigger exercise_calibrations_enforce_exercise_ownership
  before insert or update on public.exercise_calibrations
  for each row execute function public.enforce_exercise_calibration_exercise_ownership();

-- ---------------------------------------------------------------------------
-- nodes (global MVP catalog — tiny linear chain)
-- ---------------------------------------------------------------------------
create table public.nodes (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  sort_order int not null check (sort_order >= 1),
  unlock_credits_cost numeric(14, 2) not null default 0
    check (unlock_credits_cost >= 0),
  base_idle_rate numeric(12, 4) not null default 0
    check (base_idle_rate >= 0),
  max_level int not null default 1
    check (max_level >= 1 and max_level <= 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint nodes_slug_unique unique (slug)
);

create index nodes_sort_order_idx on public.nodes (sort_order);

-- ---------------------------------------------------------------------------
-- user_nodes (owned progression on catalog nodes)
-- ---------------------------------------------------------------------------
create table public.user_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  node_id uuid not null references public.nodes (id) on delete restrict,
  level int not null default 0 check (level >= 0 and level <= 1),
  is_unlocked boolean not null default false,
  unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_nodes_unique_user_node unique (user_id, node_id)
);

create index user_nodes_user_id_idx on public.user_nodes (user_id);
create index user_nodes_user_unlocked_idx
  on public.user_nodes (user_id, is_unlocked);

create trigger user_nodes_set_updated_at
  before update on public.user_nodes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- prestige_attempts: recover in-progress attempts after app close
-- ---------------------------------------------------------------------------
alter table public.prestige_attempts
  add column if not exists updated_at timestamptz not null default now();

create trigger prestige_attempts_set_updated_at
  before update on public.prestige_attempts
  for each row execute function public.set_updated_at();

create unique index prestige_attempts_one_started_per_user
  on public.prestige_attempts (user_id)
  where status = 'started';

-- ---------------------------------------------------------------------------
-- RLS: exercise_calibrations
-- ---------------------------------------------------------------------------
alter table public.exercise_calibrations enable row level security;

create policy exercise_calibrations_select_own
  on public.exercise_calibrations for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- RLS: nodes (catalog readable by authenticated users)
-- ---------------------------------------------------------------------------
alter table public.nodes enable row level security;

create policy nodes_select_authenticated
  on public.nodes for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- RLS: user_nodes
-- ---------------------------------------------------------------------------
alter table public.user_nodes enable row level security;

create policy user_nodes_select_own
  on public.user_nodes for select
  using (auth.uid() = user_id);
