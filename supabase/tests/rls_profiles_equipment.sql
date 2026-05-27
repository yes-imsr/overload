-- OVR-16: RLS smoke checks for profiles + equipment
-- Run after `supabase db reset` with two test users created via Auth.
--
-- Example (replace UUIDs with users from `auth.users` after signup):
--   \set user_a 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
--   \set user_b 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

-- ---------------------------------------------------------------------------
-- Owner can read and update own profile; cannot read another user's profile
-- ---------------------------------------------------------------------------
-- As user A (authenticated):
--   select * from public.profiles where id = :'user_a';          -- expect 1 row
--   update public.profiles set display_name = 'A' where id = :'user_a';  -- ok
--   select * from public.profiles where id = :'user_b';          -- expect 0 rows

-- ---------------------------------------------------------------------------
-- Owner can CRUD own equipment; cannot access another user's equipment
-- ---------------------------------------------------------------------------
-- As user A:
--   insert into public.equipment (user_id, name, equipment_type)
--   values (:'user_a', 'Barbell', 'barbell');                    -- ok
--   select * from public.equipment where user_id = :'user_a';    -- expect rows
--   select * from public.equipment where user_id = :'user_b';    -- expect 0 rows
--   update public.equipment set name = 'Rogue Bar' where user_id = :'user_b'; -- 0 rows updated

-- ---------------------------------------------------------------------------
-- Non-owner / anon cannot read profiles or equipment
-- ---------------------------------------------------------------------------
-- As anon (no JWT):
--   select * from public.profiles;   -- expect 0 rows (RLS)
--   select * from public.equipment;  -- expect 0 rows (RLS)

-- ---------------------------------------------------------------------------
-- Unique equipment name per user (case-insensitive)
-- ---------------------------------------------------------------------------
-- As user A:
--   insert into public.equipment (user_id, name, equipment_type)
--   values (:'user_a', 'barbell', 'barbell');
--   insert into public.equipment (user_id, name, equipment_type)
--   values (:'user_a', 'Barbell', 'dumbbell');  -- expect unique violation
