# Supabase migrations — Overload MVP

Migrations apply in timestamp order. OVERLOAD-001B delivers the MVP schema.

| Migration | Purpose |
|-----------|---------|
| `20260526120000_overload_mvp_extensions_and_functions.sql` | Extensions, `set_updated_at()` |
| `20260526120001_overload_mvp_tables.sql` | MVP tables and indexes, including workout template exercise rows |
| `20260526120002_overload_mvp_triggers.sql` | Immutability, owner consistency, auth bootstrap |
| `20260526120003_overload_mvp_rls.sql` | RLS enable + owner-scoped policies |
| `20260526120004_overload_mvp_seed_exercises.sql` | Built-in exercise catalog |

## Local apply

Requires [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker.

```bash
supabase start
supabase db reset
```

`db reset` runs all migrations and `seed.sql` (duplicate-safe with migration seed).

## Smoke test

See `supabase/tests/mvp_schema_smoke.sql`.
