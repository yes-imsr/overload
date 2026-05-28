-- OVERLOAD-001B: Row Level Security policies

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select_own
  on public.profiles for select
  using (auth.uid() = id);

create policy profiles_insert_own
  on public.profiles for insert
  with check (auth.uid() = id);

create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- equipment
-- ---------------------------------------------------------------------------
alter table public.equipment enable row level security;

create policy equipment_select_own
  on public.equipment for select
  using (auth.uid() = user_id);

create policy equipment_insert_own
  on public.equipment for insert
  with check (auth.uid() = user_id);

create policy equipment_update_own
  on public.equipment for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy equipment_delete_own
  on public.equipment for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- exercises (built-ins readable by all authenticated users)
-- ---------------------------------------------------------------------------
alter table public.exercises enable row level security;

create policy exercises_select_builtin_or_own
  on public.exercises for select
  using (
    (is_builtin = true and user_id is null)
    or auth.uid() = user_id
  );

create policy exercises_insert_custom
  on public.exercises for insert
  with check (
    auth.uid() = user_id
    and is_builtin = false
  );

create policy exercises_update_own_custom
  on public.exercises for update
  using (auth.uid() = user_id and is_builtin = false)
  with check (auth.uid() = user_id and is_builtin = false);

create policy exercises_delete_own_custom
  on public.exercises for delete
  using (auth.uid() = user_id and is_builtin = false);

-- ---------------------------------------------------------------------------
-- workout_templates
-- ---------------------------------------------------------------------------
alter table public.workout_templates enable row level security;

create policy workout_templates_select_own
  on public.workout_templates for select
  using (auth.uid() = user_id);

create policy workout_templates_insert_own
  on public.workout_templates for insert
  with check (auth.uid() = user_id);

create policy workout_templates_update_own
  on public.workout_templates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy workout_templates_delete_own
  on public.workout_templates for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- workout_template_exercises
-- ---------------------------------------------------------------------------
alter table public.workout_template_exercises enable row level security;

create policy workout_template_exercises_select_own
  on public.workout_template_exercises for select
  using (auth.uid() = user_id);

create policy workout_template_exercises_insert_own_template
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

create policy workout_template_exercises_update_own_template
  on public.workout_template_exercises for update
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.workout_templates wt
      where wt.id = template_id
        and wt.user_id = auth.uid()
    )
  )
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

-- ---------------------------------------------------------------------------
-- workout_sessions (client may not complete via direct update — enforced by trigger)
-- ---------------------------------------------------------------------------
alter table public.workout_sessions enable row level security;

create policy workout_sessions_select_own
  on public.workout_sessions for select
  using (auth.uid() = user_id);

create policy workout_sessions_insert_own
  on public.workout_sessions for insert
  with check (
    auth.uid() = user_id
    and status in ('draft', 'in_progress')
  );

create policy workout_sessions_update_active
  on public.workout_sessions for update
  using (
    auth.uid() = user_id
    and status in ('draft', 'in_progress', 'abandoned')
  )
  with check (
    auth.uid() = user_id
    and status in ('draft', 'in_progress', 'abandoned')
  );

create policy workout_sessions_delete_draft
  on public.workout_sessions for delete
  using (
    auth.uid() = user_id
    and status = 'draft'
  );

-- ---------------------------------------------------------------------------
-- workout_sets
-- ---------------------------------------------------------------------------
alter table public.workout_sets enable row level security;

create policy workout_sets_select_own
  on public.workout_sets for select
  using (auth.uid() = user_id);

create policy workout_sets_insert_active_session
  on public.workout_sets for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.workout_sessions ws
      where ws.id = session_id
        and ws.user_id = auth.uid()
        and ws.status in ('draft', 'in_progress')
    )
  );

create policy workout_sets_update_active_session
  on public.workout_sets for update
  using (
    auth.uid() = user_id
    and is_completed = false
    and exists (
      select 1
      from public.workout_sessions ws
      where ws.id = session_id
        and ws.user_id = auth.uid()
        and ws.status in ('draft', 'in_progress')
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.workout_sessions ws
      where ws.id = session_id
        and ws.user_id = auth.uid()
        and ws.status in ('draft', 'in_progress')
    )
  );

create policy workout_sets_delete_incomplete
  on public.workout_sets for delete
  using (
    auth.uid() = user_id
    and is_completed = false
    and exists (
      select 1
      from public.workout_sessions ws
      where ws.id = session_id
        and ws.user_id = auth.uid()
        and ws.status in ('draft', 'in_progress')
    )
  );

-- ---------------------------------------------------------------------------
-- game_state (read-only for clients; writes via service role / Edge Functions)
-- ---------------------------------------------------------------------------
alter table public.game_state enable row level security;

create policy game_state_select_own
  on public.game_state for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- game_events (append-only; service role bypasses RLS)
-- ---------------------------------------------------------------------------
alter table public.game_events enable row level security;

create policy game_events_select_own
  on public.game_events for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- debuffs (read-only for clients)
-- ---------------------------------------------------------------------------
alter table public.debuffs enable row level security;

create policy debuffs_select_own
  on public.debuffs for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- prestige_attempts (read-only for clients)
-- ---------------------------------------------------------------------------
alter table public.prestige_attempts enable row level security;

create policy prestige_attempts_select_own
  on public.prestige_attempts for select
  using (auth.uid() = user_id);
