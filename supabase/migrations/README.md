# Supabase migrations — Overload MVP

Migrations apply in timestamp order. OVERLOAD-001B delivers the MVP schema.

| Migration | Purpose |
|-----------|---------|
| `20260526120000_overload_mvp_extensions_and_functions.sql` | Extensions, `set_updated_at()` |
| `20260526120001_overload_mvp_tables.sql` | MVP tables and indexes |
| `20260526120002_overload_mvp_triggers.sql` | Immutability, consistency, auth bootstrap |
| `20260526120003_overload_mvp_rls.sql` | RLS enable + policies |
| `20260526120004_overload_mvp_seed_exercises.sql` | Built-in exercise catalog |
| `20260528120000_ovr17_workout_template_exercises.sql` | OVR-17: `workout_template_exercises` + RLS |
| `20260528130000_ovr18_game_persistence_schema.sql` | OVR-18: `exercise_calibrations`, `nodes`, `user_nodes`, prestige recovery index |
| `20260528130001_ovr18_seed_mvp_nodes.sql` | OVR-18: MVP node catalog seed |

Workout persistence (exercises, templates, sessions, sets, immutability triggers, RLS) ships in OVERLOAD-001B migrations `20260526120001`–`20260526120003`. OVR-17 adds normalized template exercise rows. Game tables `game_state`, `game_events`, `debuffs`, and `prestige_attempts` ship in OVERLOAD-001B; OVR-18 adds nodes, user nodes, exercise calibrations, and pgTAP in `supabase/tests/game_persistence_rls.test.sql`.

## Local apply

Requires [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker.

```bash
supabase start
supabase db reset
```

`db reset` runs all migrations and `seed.sql` (duplicate-safe with migration seed).

## Smoke test

See `supabase/tests/mvp_schema_smoke.sql`.
