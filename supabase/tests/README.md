# Supabase tests

Manual smoke and RLS verification scripts. Run after `supabase db reset`.

| File | Issue | Purpose |
|------|-------|---------|
| `mvp_schema_smoke.sql` | OVERLOAD-001B | Table existence, RLS enabled, seed counts |
| `rls_profiles_equipment.sql` | OVR-16 | Owner vs non-owner scenarios for `profiles` and `equipment` |
