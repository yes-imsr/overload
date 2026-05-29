-- OVR-32: Power Credits claim and MVP node upgrades

alter table public.game_events
  drop constraint if exists game_events_event_type_check;

alter table public.game_events
  add constraint game_events_event_type_check
  check (event_type in (
    'workout_completed',
    'power_awarded',
    'credits_claimed',
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
  drop constraint if exists game_events_source_type_check;

alter table public.game_events
  add constraint game_events_source_type_check
  check (source_type in (
    'workout_session',
    'debuff',
    'prestige_attempt',
    'node',
    'system',
    'manual_correction'
  ));

-- Keep the MVP economy immediately usable: the free Core Reactor is the
-- baseline Power-to-Credits converter, while paid nodes remain opt-in.
insert into public.user_nodes (
  user_id,
  node_id,
  level,
  is_unlocked,
  unlocked_at
)
select
  p.id,
  n.id,
  1,
  true,
  now()
from public.profiles p
cross join public.nodes n
where n.is_active = true
  and n.unlock_credits_cost = 0
on conflict (user_id, node_id) do update
set
  level = greatest(public.user_nodes.level, excluded.level),
  is_unlocked = public.user_nodes.is_unlocked or excluded.is_unlocked,
  unlocked_at = coalesce(public.user_nodes.unlocked_at, excluded.unlocked_at);

update public.game_state gs
set idle_rate = coalesce((
  select sum(n.base_idle_rate * un.level)
  from public.user_nodes un
  join public.nodes n on n.id = un.node_id
  where un.user_id = gs.user_id
    and un.is_unlocked = true
    and n.is_active = true
), 0);
