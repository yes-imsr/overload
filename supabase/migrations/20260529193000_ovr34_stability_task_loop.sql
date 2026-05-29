-- OVR-34: one safe Stability Task loop

-- The MVP has exactly one Stability Task/debuff type. This partial unique
-- index keeps trusted Edge Function writes from creating duplicate open tasks.
create unique index debuffs_one_open_stability_task_per_user
  on public.debuffs (user_id)
  where debuff_type = 'power_gain_reduction'
    and status in ('pending_reveal', 'active');
