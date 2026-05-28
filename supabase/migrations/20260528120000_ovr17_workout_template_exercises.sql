-- OVR-17: normalized template exercise rows (complements planned_exercises jsonb on workout_templates)

create table public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  sort_order int not null check (sort_order >= 1),
  target_sets int not null default 3
    check (target_sets >= 1 and target_sets <= 20),
  target_rep_min int
    check (target_rep_min is null or (target_rep_min >= 1 and target_rep_min <= 100)),
  target_rep_max int
    check (target_rep_max is null or (target_rep_max >= 1 and target_rep_max <= 100)),
  planned_weight numeric(8, 2)
    check (planned_weight is null or planned_weight >= 0),
  equipment_id uuid references public.equipment (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_template_exercises_rep_range_check
    check (
      target_rep_min is null
      or target_rep_max is null
      or target_rep_max >= target_rep_min
    )
);

create unique index workout_template_exercises_template_order_unique
  on public.workout_template_exercises (template_id, sort_order);

create index workout_template_exercises_user_id_idx
  on public.workout_template_exercises (user_id);

create index workout_template_exercises_template_id_idx
  on public.workout_template_exercises (template_id, sort_order);

create trigger workout_template_exercises_set_updated_at
  before update on public.workout_template_exercises
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- template_id owner must match user_id
-- ---------------------------------------------------------------------------
create or replace function public.enforce_workout_template_exercise_user_consistency()
returns trigger
language plpgsql
as $$
declare
  template_owner uuid;
begin
  select wt.user_id into template_owner
  from public.workout_templates wt
  where wt.id = new.template_id;

  if template_owner is null then
    raise exception 'workout template % not found', new.template_id;
  end if;

  if new.user_id is distinct from template_owner then
    raise exception 'workout_template_exercises.user_id must match workout_templates.user_id';
  end if;

  return new;
end;
$$;

create trigger workout_template_exercises_enforce_user_consistency
  before insert or update on public.workout_template_exercises
  for each row execute function public.enforce_workout_template_exercise_user_consistency();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.workout_template_exercises enable row level security;

create policy workout_template_exercises_select_own
  on public.workout_template_exercises for select
  using (auth.uid() = user_id);

create policy workout_template_exercises_insert_own
  on public.workout_template_exercises for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.workout_templates wt
      where wt.id = template_id
        and wt.user_id = auth.uid()
    )
  );

create policy workout_template_exercises_update_own
  on public.workout_template_exercises for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.workout_templates wt
      where wt.id = template_id
        and wt.user_id = auth.uid()
    )
  );

create policy workout_template_exercises_delete_own
  on public.workout_template_exercises for delete
  using (auth.uid() = user_id);
