-- OVERLOAD-001B: integrity triggers, immutability, profile bootstrap

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() ->> 'role') = 'service_role',
    false
  );
$$;

comment on function public.is_service_role() is
  'True when the current JWT role is service_role (Edge Functions / admin).';

-- ---------------------------------------------------------------------------
-- workout_sets.user_id must match parent session owner
-- ---------------------------------------------------------------------------
create or replace function public.enforce_workout_set_user_consistency()
returns trigger
language plpgsql
as $$
declare
  session_owner uuid;
begin
  select ws.user_id into session_owner
  from public.workout_sessions ws
  where ws.id = new.session_id;

  if session_owner is null then
    raise exception 'workout session % not found', new.session_id;
  end if;

  if new.user_id is distinct from session_owner then
    raise exception 'workout_sets.user_id must match workout_sessions.user_id';
  end if;

  return new;
end;
$$;

create trigger workout_sets_enforce_user_consistency
  before insert or update on public.workout_sets
  for each row execute function public.enforce_workout_set_user_consistency();

-- ---------------------------------------------------------------------------
-- Block client mutation of server-calculated session fields
-- ---------------------------------------------------------------------------
create or replace function public.enforce_workout_session_server_fields()
returns trigger
language plpgsql
as $$
begin
  if public.is_service_role() then
    return new;
  end if;

  if (
    old.total_volume is distinct from new.total_volume
    or old.power_awarded is distinct from new.power_awarded
    or old.credits_awarded is distinct from new.credits_awarded
    or old.status is distinct from new.status
      and new.status in ('completed', 'corrected')
    or old.completed_at is distinct from new.completed_at
      and new.status = 'completed'
  ) then
    raise exception 'workout session completion and reward fields are server-only';
  end if;

  return new;
end;
$$;

create trigger workout_sessions_enforce_server_fields
  before update on public.workout_sessions
  for each row execute function public.enforce_workout_session_server_fields();

-- ---------------------------------------------------------------------------
-- Completed / corrected session immutability
-- ---------------------------------------------------------------------------
create or replace function public.enforce_workout_session_immutability()
returns trigger
language plpgsql
as $$
begin
  if old.status not in ('completed', 'corrected') then
    return new;
  end if;

  if public.is_service_role() then
    -- Service role may only mark completed → corrected with linkage fields
    if old.status = 'completed'
      and new.status = 'corrected'
      and new.corrected_by_session_id is not null
      and (
        new.id = old.id
        and new.user_id = old.user_id
        and new.template_id is not distinct from old.template_id
        and new.started_at is not distinct from old.started_at
        and new.completed_at is not distinct from old.completed_at
        and new.total_volume is not distinct from old.total_volume
        and new.power_awarded is not distinct from old.power_awarded
        and new.credits_awarded is not distinct from old.credits_awarded
        and new.completion_version is not distinct from old.completion_version
      )
    then
      return new;
    end if;

    raise exception 'invalid correction update on completed workout session';
  end if;

  raise exception 'completed workout sessions are immutable';
end;
$$;

create trigger workout_sessions_enforce_immutability
  before update on public.workout_sessions
  for each row execute function public.enforce_workout_session_immutability();

create or replace function public.prevent_completed_session_delete()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('completed', 'corrected') and not public.is_service_role() then
    raise exception 'completed workout sessions cannot be deleted';
  end if;

  return old;
end;
$$;

create trigger workout_sessions_prevent_completed_delete
  before delete on public.workout_sessions
  for each row execute function public.prevent_completed_session_delete();

-- ---------------------------------------------------------------------------
-- Completed set immutability
-- ---------------------------------------------------------------------------
create or replace function public.enforce_workout_set_immutability()
returns trigger
language plpgsql
as $$
declare
  parent_status text;
begin
  if tg_op = 'DELETE' then
    if old.is_completed and not public.is_service_role() then
      raise exception 'completed workout sets cannot be deleted';
    end if;

    select ws.status into parent_status
    from public.workout_sessions ws
    where ws.id = old.session_id;

    if parent_status in ('completed', 'corrected') and not public.is_service_role() then
      raise exception 'sets on completed sessions cannot be deleted';
    end if;

    return old;
  end if;

  if tg_op = 'UPDATE' and old.is_completed and not public.is_service_role() then
    raise exception 'completed workout sets are immutable';
  end if;

  select ws.status into parent_status
  from public.workout_sessions ws
  where ws.id = coalesce(new.session_id, old.session_id);

  if parent_status in ('completed', 'corrected') and not public.is_service_role() then
    raise exception 'sets on completed sessions are immutable';
  end if;

  return new;
end;
$$;

create trigger workout_sets_enforce_immutability
  before update or delete on public.workout_sets
  for each row execute function public.enforce_workout_set_immutability();

-- ---------------------------------------------------------------------------
-- game_events append-only for non-service roles
-- ---------------------------------------------------------------------------
create or replace function public.prevent_game_events_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_service_role() then
      raise exception 'game_events is append-only; writes require service role';
    end if;
    return new;
  end if;

  if not public.is_service_role() then
    raise exception 'game_events is append-only; writes require service role';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger game_events_prevent_mutation
  before insert or update or delete on public.game_events
  for each row execute function public.prevent_game_events_mutation();

-- ---------------------------------------------------------------------------
-- Profile + game_state bootstrap on auth signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.game_state (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on function public.handle_new_user() is
  'Creates profiles and game_state rows when a Supabase Auth user is created.';
