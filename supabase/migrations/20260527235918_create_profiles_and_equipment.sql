create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  training_experience text check (
    training_experience in ('new', 'intermediate', 'advanced')
  ),
  training_focus text check (
    training_focus in ('strength', 'general')
  ),
  training_days_per_week integer check (
    training_days_per_week between 1 and 7
  ),
  onboarding_status text not null default 'not_started' check (
    onboarding_status in (
      'not_started',
      'profile_complete',
      'equipment_complete',
      'complete'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  equipment_type text not null check (
    equipment_type in (
      'barbell',
      'dumbbell',
      'machine',
      'cable',
      'bodyweight',
      'other'
    )
  ),
  weight_unit text not null default 'lb' check (
    weight_unit in ('lb', 'kg')
  ),
  min_weight numeric(7, 2),
  max_weight numeric(7, 2),
  increment numeric(7, 2),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (increment is null or increment > 0),
  check (
    min_weight is null
    or max_weight is null
    or max_weight >= min_weight
  )
);

create unique index equipment_user_lower_name_key
  on public.equipment (user_id, lower(name));

create index equipment_user_id_idx
  on public.equipment (user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create trigger set_equipment_updated_at
  before update on public.equipment
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.equipment enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.equipment to authenticated;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) is not null and id = (select auth.uid()));

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) is not null and id = (select auth.uid()))
  with check ((select auth.uid()) is not null and id = (select auth.uid()));

create policy "equipment_select_own"
  on public.equipment
  for select
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "equipment_insert_own"
  on public.equipment
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "equipment_update_own"
  on public.equipment
  for update
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "equipment_delete_own"
  on public.equipment
  for delete
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));
