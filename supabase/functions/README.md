# Supabase Edge Functions

Edge Functions for server-validated workout completion, progression, prestige, debuffs, and sync live here.

| Function | Purpose |
|----------|---------|
| `complete-workout-session` | Finalize in-progress sessions, calculate volume/Power server-side, apply progression from `@overload/core-engine`, append game events |

Edge functions import domain logic via `supabase/functions/import_map.json` → `packages/core-engine`. Shared adapters under `_shared/` only map DB shapes to core-engine inputs.
