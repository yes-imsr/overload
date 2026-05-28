-- OVR-18: tiny MVP node chain (linear, no tree)

insert into public.nodes (
  id,
  slug,
  name,
  description,
  sort_order,
  unlock_credits_cost,
  base_idle_rate,
  max_level,
  is_active
)
values
  (
    'b0000001-0000-4000-8000-000000000001',
    'core-reactor',
    'Core Reactor',
    'Baseline idle Credits from stored Power.',
    1,
    0,
    1.0,
    1,
    true
  ),
  (
    'b0000001-0000-4000-8000-000000000002',
    'credit-condenser',
    'Credit Condenser',
    'Increases idle conversion efficiency.',
    2,
    100,
    1.5,
    1,
    true
  ),
  (
    'b0000001-0000-4000-8000-000000000003',
    'stability-regulator',
    'Stability Regulator',
    'Reduces entropy pressure after workouts.',
    3,
    250,
    0.5,
    1,
    true
  )
on conflict (id) do nothing;
