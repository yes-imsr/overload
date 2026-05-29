# Supabase Edge Functions

Edge Functions for server-validated workout completion, progression, prestige, debuffs, and sync live here.

| Function | Purpose |
|----------|---------|
| `complete-workout-session` | Finalize in-progress sessions, calculate volume/Power server-side, apply progression and Entropy from `@overload/core-engine`, assign one Stability Task when needed, append game events |
| `reveal-stability-task` | Reveal the one MVP Stability Task and mark it active through trusted persistence |
| `resolve-stability-task` | Resolve the active Stability Task through the safe Recovery Challenge action |

Edge functions consume domain logic from `@overload/core-engine` via a bundled artifact:

```bash
pnpm bundle:edge-core-engine
```

This writes `supabase/functions/_shared/core-engine.bundle.mjs` (required before `supabase functions serve` or deploy). Shared adapters under `_shared/` only map DB shapes to core-engine inputs.
