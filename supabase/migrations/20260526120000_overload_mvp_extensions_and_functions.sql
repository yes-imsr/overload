-- OVERLOAD-001B: extensions and shared functions
-- https://supabase.com/docs/guides/database/extensions

create extension if not exists "pgcrypto" with schema extensions;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Sets updated_at to now() on row update for mutable tables.';
