# Supabase Edge Functions

Edge Functions for server-validated workout completion, progression, prestige, debuffs, and sync live here.

| Function | Purpose |
|----------|---------|
| `complete-workout-session` | Finalize in-progress sessions, calculate volume/Power server-side, apply progression from `@overload/core-engine`, append game events |

Edge functions consume domain logic from `@overload/core-engine` via a bundled artifact:

```bash
pnpm bundle:edge-core-engine
```

This writes `supabase/functions/_shared/core-engine.bundle.mjs` (required before `supabase functions serve` or deploy). Shared adapters under `_shared/` only map DB shapes to core-engine inputs.
