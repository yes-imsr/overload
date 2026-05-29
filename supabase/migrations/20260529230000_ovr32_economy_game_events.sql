-- OVR-32: economy game event types for node unlocks

alter table public.game_events
  drop constraint if exists game_events_event_type_check;

alter table public.game_events
  add constraint game_events_event_type_check
  check (event_type in (
    'workout_completed',
    'power_awarded',
    'credits_claimed',
    'node_unlocked',
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
