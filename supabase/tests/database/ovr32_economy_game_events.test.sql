BEGIN;
SELECT plan(2);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'game_events'
      AND c.conname = 'game_events_event_type_check'
      AND pg_get_constraintdef(c.oid) LIKE '%node_unlocked%'
  ),
  'game_events allows node_unlocked event type'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'game_events'
      AND c.conname = 'game_events_source_type_check'
      AND pg_get_constraintdef(c.oid) LIKE '%node%'
  ),
  'game_events allows node source type'
);

SELECT * FROM finish();
ROLLBACK;
