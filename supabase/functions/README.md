# Supabase Edge Functions

Edge Functions for server-validated workout completion, progression, prestige, debuffs, and sync live here.

| Function | Purpose |
|----------|---------|
| `complete-workout-session` | Finalize sessions, award Power, apply progression, economy settlement, and Stability Task effects |
| `economy-snapshot` | Read server-computed economy state (balances, pending Credits, nodes) |
| `claim-idle-credits` | Claim accrued Credits from stored Power |
| `upgrade-node` | Spend Credits to unlock MVP nodes |
| `stability-snapshot` | Read server-computed Entropy and Stability Task state |
| `reveal-debuff` | Reveal pending Stability Task when a workout is in progress |
| `resolve-debuff` | Resolve the active Stability Task |
| `delete-account` | Permanently delete the authenticated user and cascade-delete all app data |

Edge functions consume domain logic from `@overload/core-engine` via a bundled artifact:

```bash
pnpm bundle:edge-core-engine
```

This writes `supabase/functions/_shared/core-engine.bundle.mjs` (required before `supabase functions serve` or deploy). Shared adapters under `_shared/` only map DB shapes to core-engine inputs.
