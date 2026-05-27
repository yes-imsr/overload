# Architecture Plan: Supabase MVP Schema + Server Boundaries

## 1. Architecture Overview

Build the Supabase MVP schema and server boundary layer for Overload’s core loop:

> Workout logging → calibration/progression → Power/Credits game state → debuff/prestige events.

This is MVP-critical backend foundation. It supports the approved stack: React Native + Expo, TanStack Query, Zustand for local workout drafts, Supabase Auth/Postgres/RLS, Edge Functions, and pure TypeScript domain logic in `/packages/core-engine`.

Hard line: Supabase stores state and enforces integrity. `/packages/core-engine` owns deterministic rules. Edge Functions orchestrate validated server mutations using core-engine. The mobile app does not calculate final progression, prestige, debuffs, or economy outcomes.

MVP only. Defer nutrition, social, squads, leaderboards, watch/wearables, monetization, subscriptions, complex anti-cheat, complex node trees, multiple debuff types, and multiple prestige modes.

---

## 2. Table Purposes

### `profiles`

User-owned app profile connected to Supabase Auth. Stores onboarding/training profile inputs needed for calibration and UX.

### `equipment`

User-owned equipment inventory. Needed because machines, increments, and available implements affect workout templates and progression.

### `exercises`

Canonical exercise definitions plus optional user-created exercise rows. Needed for sets, templates, calibration, and progression.

### `workout_templates`

User-owned planned workouts. Stores template metadata and versioning. Template exercises can be represented initially as structured relational child rows later, but for this MVP table-only scope, use a constrained JSON structure only for planned exercise order if absolutely necessary.

### `workout_sessions`

One workout instance. Starts as draft/in-progress, becomes immutable after completion.

### `workout_sets`

Logged set records. Draft/in-progress sets may be edited. Completed sets are immutable.

### `game_state`

One row per user. Current Power, Credits, Entropy, prestige level, idle checkpoint, and current economy state.

### `game_events`

Append-only game audit log. Records Power gains, Credit claims, debuff assignment/resolution, prestige attempt results, and server-calculated progression events.

### `debuffs`

Current and historical debuffs. MVP supports one safe debuff type only. Do not model a large debuff system yet.

### `prestige_attempts`

Tracks manual prestige attempts, eligibility snapshot, result, lockout, and reward/penalty effects.

### Optional: `body_metrics`

Only include if onboarding requires height/weight/age/sex persistence outside `profiles`. Otherwise defer. Nutrition and advanced body tracking are explicitly not MVP.

---

## 3. Recommended Columns

Use UUID primary keys, `created_at timestamptz not null default now()`, and `updated_at timestamptz not null default now()` where rows are mutable. For immutable/audit tables, avoid `updated_at` unless needed for system maintenance.

### `profiles`

```sql
id uuid primary key references auth.users(id) on delete cascade

display_name text
training_experience text not null check (training_experience in ('new','intermediate','advanced'))
height_cm numeric(5,2)
weight_kg numeric(6,2)
birth_year int
sex text check (sex in ('male','female','other','prefer_not_to_say'))
onboarding_status text not null default 'not_started'
  check (onboarding_status in ('not_started','profile_complete','equipment_complete','calibration_started','complete'))
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Notes:

- Avoid storing age directly. Store `birth_year` or defer exact birth date unless actually needed.
- `sex` only exists because calibration setup requested it in source product docs. Keep it optional/sparse.

### `equipment`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null references profiles(id) on delete cascade
name text not null
equipment_type text not null
  check (equipment_type in ('barbell','dumbbell','machine','cable','bodyweight','other'))
weight_unit text not null default 'lb'
  check (weight_unit in ('lb','kg'))
min_weight numeric(7,2)
max_weight numeric(7,2)
increment numeric(7,2)
is_available boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Constraints:

- `increment > 0` when provided.
- `max_weight >= min_weight` when both provided.
- Unique index on `(user_id, lower(name))`.

### `exercises`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid references profiles(id) on delete cascade
name text not null
movement_pattern text
  check (movement_pattern in ('push','pull','squat','hinge','carry','core','isolation','other'))
primary_muscle_group text
equipment_type text
  check (equipment_type in ('barbell','dumbbell','machine','cable','bodyweight','other'))
is_builtin boolean not null default false
calibration_status text not null default 'uncalibrated'
  check (calibration_status in ('uncalibrated','provisional','calibrated'))
calibrated_at timestamptz
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Notes:

- Built-in exercises have `user_id null`.
- User exercises have `user_id = auth.uid()`.
- Calibration status belongs here only if calibration is exercise-level.
- If calibration becomes per-user/per-exercise for built-ins, add `exercise_calibrations` later. Do not add that table in this story unless Cursor hits a real blocker.

### `workout_templates`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null references profiles(id) on delete cascade
name text not null
description text
status text not null default 'active'
  check (status in ('draft','active','archived'))
template_version int not null default 1
planned_exercises jsonb not null default '[]'::jsonb
created_from_template_id uuid references workout_templates(id)
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

JSON warning:

- `planned_exercises` is acceptable only as a temporary MVP compromise if the repo is not ready for `workout_template_exercises`.
- It must be schema-validated in Edge Functions and app code.
- Do not store completed workout performance inside this JSON. Ever.

Recommended MVP shape:

```ts
[
  {
    exerciseId: string,
    order: number,
    targetSets: number,
    targetRepMin: number,
    targetRepMax: number,
    plannedWeight: number | null,
    equipmentId: string | null
  }
]
```

### `workout_sessions`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null references profiles(id) on delete cascade
template_id uuid references workout_templates(id)
status text not null default 'draft'
  check (status in ('draft','in_progress','completed','abandoned','corrected'))
started_at timestamptz
completed_at timestamptz
abandoned_at timestamptz
source text not null default 'mobile'
  check (source in ('mobile','edge_function','import'))
client_session_key text
total_volume numeric(12,2)
power_awarded numeric(12,2)
credits_awarded numeric(12,2)
completion_version int not null default 1
corrected_by_session_id uuid references workout_sessions(id)
correction_reason text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Rules:

- `completed_at is not null` when `status = 'completed'`.
- `abandoned_at is not null` when `status = 'abandoned'`.
- Unique `(user_id, client_session_key)` where `client_session_key is not null` for idempotent offline sync.
- Completed sessions are immutable. Corrections create a new session version and mark the old session as corrected through a controlled server path, not direct client mutation.

### `workout_sets`

```sql
id uuid primary key default gen_random_uuid()
session_id uuid not null references workout_sessions(id) on delete cascade
user_id uuid not null references profiles(id) on delete cascade
exercise_id uuid not null references exercises(id)
equipment_id uuid references equipment(id)
set_order int not null
set_type text not null default 'working'
  check (set_type in ('warmup','working','punishment','backoff'))
weight numeric(8,2) not null default 0
weight_unit text not null default 'lb'
  check (weight_unit in ('lb','kg'))
reps int not null check (reps >= 0 and reps <= 200)
rpe_label text
  check (rpe_label in ('easy','medium','hard','near_death'))
is_completed boolean not null default false
completed_at timestamptz
client_set_key text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Rules:

- Completed sets are immutable.
- Unique `(session_id, set_order)` where not deleted/corrected.
- Unique `(user_id, client_set_key)` where `client_set_key is not null`.
- `completed_at is not null` when `is_completed = true`.

### `game_state`

```sql
user_id uuid primary key references profiles(id) on delete cascade
power_balance numeric(14,2) not null default 0
credits_balance numeric(14,2) not null default 0
entropy numeric(10,2) not null default 0
prestige_level int not null default 0
idle_rate numeric(12,4) not null default 0
last_idle_claim_at timestamptz
current_debuff_id uuid
status text not null default 'active'
  check (status in ('active','prestige_locked','debuffed'))
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Notes:

- Current balances live here for fast reads.
- All balance mutations must also write `game_events`.
- Use Edge Functions/RPC for state changes. The client should not directly update balances.

### `game_events`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null references profiles(id) on delete cascade
event_type text not null
  check (event_type in (
    'workout_completed',
    'power_awarded',
    'credits_claimed',
    'debuff_assigned',
    'debuff_revealed',
    'debuff_resolved',
    'prestige_attempt_started',
    'prestige_succeeded',
    'prestige_failed',
    'correction_applied'
  ))
source_type text not null
  check (source_type in ('workout_session','debuff','prestige_attempt','system','manual_correction'))
source_id uuid
power_delta numeric(14,2) not null default 0
credits_delta numeric(14,2) not null default 0
entropy_delta numeric(10,2) not null default 0
metadata jsonb not null default '{}'::jsonb
created_at timestamptz not null default now()
```

Rules:

- Append-only.
- No client updates/deletes.
- Metadata allowed because event payloads vary, but keep it audit-only. Do not hide relational state in it.

### `debuffs`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null references profiles(id) on delete cascade
debuff_type text not null default 'power_gain_reduction'
  check (debuff_type in ('power_gain_reduction'))
status text not null default 'pending_reveal'
  check (status in ('pending_reveal','active','resolved','expired'))
assigned_at timestamptz not null default now()
revealed_at timestamptz
resolved_at timestamptz
expires_at timestamptz
source_session_id uuid references workout_sessions(id)
resolution_session_id uuid references workout_sessions(id)
effect_value numeric(8,4) not null default 0.15
metadata jsonb not null default '{}'::jsonb
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

MVP debuff:

- `power_gain_reduction` only.
- Example effect: `-15% Power gain`.
- No locked exercises, forced rep ranges, random exercise punishment sets yet unless explicitly approved.

### `prestige_attempts`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null references profiles(id) on delete cascade
status text not null default 'started'
  check (status in ('started','succeeded','failed','cancelled'))
started_at timestamptz not null default now()
completed_at timestamptz
required_credits numeric(14,2) not null
credits_at_attempt numeric(14,2) not null
target_exercise_id uuid references exercises(id)
target_metric text not null
  check (target_metric in ('estimated_1rm','rep_pr'))
target_value numeric(10,2) not null
achieved_value numeric(10,2)
source_session_id uuid references workout_sessions(id)
credit_penalty numeric(14,2) not null default 0
lockout_until timestamptz
metadata jsonb not null default '{}'::jsonb
created_at timestamptz not null default now()
```

Rules:

- Manual attempt only.
- Server decides success/failure.
- Fail penalty and lockout are server-calculated.
- MVP supports one prestige flow, not multiple modes.

### Optional: `body_metrics`

Only create if onboarding cannot proceed without historical weight storage.

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null references profiles(id) on delete cascade
measured_at timestamptz not null default now()
weight_kg numeric(6,2)
height_cm numeric(5,2)
source text not null default 'manual'
  check (source in ('manual'))
created_at timestamptz not null default now()
```

Do not add nutrition columns here.

---

## 4. Relationships

```text
auth.users
  1:1 profiles

profiles
  1:M equipment
  1:M user-created exercises
  1:M workout_templates
  1:M workout_sessions
  1:M workout_sets
  1:1 game_state
  1:M game_events
  1:M debuffs
  1:M prestige_attempts
  1:M body_metrics optional

workout_templates
  1:M workout_sessions

workout_sessions
  1:M workout_sets
  M:1 corrected_by_session via corrected_by_session_id

exercises
  1:M workout_sets
  1:M prestige_attempts target exercise

equipment
  1:M workout_sets

debuffs
  M:1 source_session
  M:1 resolution_session

prestige_attempts
  M:1 source_session
```

Important:

- `workout_sets.user_id` duplicates ownership from `session_id`. That is intentional for faster RLS and indexes.
- Add trigger validation to ensure `workout_sets.user_id = workout_sessions.user_id`.

---

## 5. Completed Workout Immutability Model

Completed workouts and sets must not be edited in place. Corrections create versions, audit records, or compensating events.

### State Rules

`workout_sessions.status`:

```text
draft → in_progress → completed
draft → abandoned
in_progress → abandoned
completed → corrected only through server correction flow
```

`workout_sets`:

```text
editable while parent session is draft/in_progress
immutable after is_completed = true or parent session = completed
```

### Enforcement

Use database triggers:

1. Block updates to `workout_sessions` where old status is `completed`, except:
   - Controlled fields needed for correction marker: `status = corrected`, `corrected_by_session_id`, `correction_reason`.
   - Only via server role / Edge Function.
2. Block updates/deletes to `workout_sets` when:
   - `old.is_completed = true`.
   - Parent session status is `completed`.
3. Corrections:
   - Create new `workout_sessions` row with `completion_version = previous.completion_version + 1`.
   - Link old/new sessions.
   - Write `game_events.event_type = 'correction_applied'`.
   - Apply compensating Power/Credit delta through server function if needed.

MVP recommendation: implement immutability now. Implement full correction UI later. But the schema must not block future correction versions.

---

## 6. RLS Policy Plan

Enable RLS on every table.

### General Rule

Users can read/write only rows where:

```sql
user_id = auth.uid()
```

For `profiles`:

```sql
id = auth.uid()
```

For built-in exercises:

```sql
is_builtin = true and user_id is null
```

### Table-Specific Policies

#### `profiles`

- Select own profile.
- Insert own profile only where `id = auth.uid()`.
- Update own profile.
- No client delete initially.

#### `equipment`

- Select/insert/update own rows.
- Delete/archive own rows only if no completed `workout_sets` reference them.
- Prefer `is_available = false` over delete.

#### `exercises`

- Select built-ins plus own custom exercises.
- Insert custom exercise with `user_id = auth.uid()` and `is_builtin = false`.
- Update own custom exercises only.
- Built-ins are server/admin managed.

#### `workout_templates`

- Select/insert/update own templates.
- Archive instead of delete if used by any completed session.

#### `workout_sessions`

- Select own.
- Insert own draft/in-progress.
- Update own only while status is `draft` or `in_progress`.
- Client cannot directly set final calculated fields: `total_volume`, `power_awarded`, `credits_awarded`.
- Client cannot mutate completed rows.

#### `workout_sets`

- Select own.
- Insert own sets for own draft/in-progress sessions.
- Update own sets only while parent session is not completed and set is not completed.
- Delete only incomplete draft sets.
- No delete of completed sets.

#### `game_state`

- Select own.
- No direct client insert/update except maybe profile bootstrap through controlled RPC.
- All balance mutations via Edge Function/service role.

#### `game_events`

- Select own.
- No client insert/update/delete.
- Edge Functions only.

#### `debuffs`

- Select own.
- No direct client insert/update/delete.
- Reveal/resolve via Edge Function.

#### `prestige_attempts`

- Select own.
- Insert via Edge Function only.
- No direct update/delete.

#### `body_metrics`

- Select/insert own.
- Update/delete own only if not used in progression snapshot.
- Simpler: append-only after creation.

---

## 7. Required Indexes

### Ownership/Access Indexes

```sql
profiles(id)

equipment(user_id)
equipment(user_id, is_available)

exercises(user_id)
exercises(is_builtin)
exercises(user_id, calibration_status)

workout_templates(user_id, status)

workout_sessions(user_id, status)
workout_sessions(user_id, started_at desc)
workout_sessions(user_id, completed_at desc)
workout_sessions(template_id)
workout_sessions(user_id, client_session_key) unique where client_session_key is not null

workout_sets(user_id)
workout_sets(session_id, set_order)
workout_sets(exercise_id, completed_at desc)
workout_sets(user_id, client_set_key) unique where client_set_key is not null

game_events(user_id, created_at desc)
game_events(user_id, event_type, created_at desc)
game_events(source_type, source_id)

debuffs(user_id, status)
debuffs(user_id, assigned_at desc)

prestige_attempts(user_id, status)
prestige_attempts(user_id, started_at desc)
```

### Optional Constraints as Indexes

```sql
game_state(user_id) primary key
body_metrics(user_id, measured_at desc)
```

---

## 8. Migration Ordering

1. Enable extensions:
   - `pgcrypto` or Supabase UUID default support.
2. Create enum-like check conventions or actual Postgres enums.
   - Recommendation: check constraints for MVP agility.
3. Create `profiles`.
4. Create `equipment`.
5. Create `exercises`.
6. Create `workout_templates`.
7. Create `workout_sessions`.
8. Create `workout_sets`.
9. Create `game_state`.
10. Create `game_events`.
11. Create `debuffs`.
12. Add `game_state.current_debuff_id` FK to `debuffs(id)` after `debuffs` exists.
13. Create `prestige_attempts`.
14. Optional: create `body_metrics`.
15. Add triggers:
    - `updated_at`
    - ownership consistency
    - immutability
    - game_state bootstrap after profile insert, if desired
16. Add indexes.
17. Enable RLS.
18. Add RLS policies.
19. Add seed data for built-in exercises.
20. Add migration tests / smoke SQL.

Do not let Cursor create tables without RLS in the same PR. Database/security stories require human approval.

---

## 9. Edge Function Boundaries

Edge Functions should orchestrate state changes, call `/packages/core-engine`, validate auth/input, and write transactionally.

### Required MVP Edge Functions

#### `complete-workout-session`

Purpose:

- Finalize a workout session.
- Lock session/sets.
- Calculate total volume, Power, calibration/progression updates, game events.
- Update `game_state`.

Input:

```ts
{
  sessionId: string;
  clientMutationId: string;
}
```

Server responsibilities:

- Verify session belongs to user.
- Verify status is `in_progress`.
- Verify at least one completed set.
- Load sets, exercises, equipment, profile, active debuff.
- Call core-engine:
  - volume calculation
  - Power calculation
  - progression recommendation
  - calibration status update
  - debuff modifier application
- In one DB transaction:
  - set session `status = completed`
  - set `completed_at`
  - store `total_volume`, `power_awarded`, `credits_awarded` if awarded immediately
  - update `game_state`
  - append `game_events`

Failure behavior:

- Idempotent by `clientMutationId`.
- If already completed, return completed state instead of double-awarding.

#### `claim-idle-credits`

Purpose:

- Convert idle progress to Credits.

Input:

```ts
{
  clientMutationId: string;
}
```

Server responsibilities:

- Load `game_state`.
- Call core-engine idle conversion.
- Update `credits_balance`, `last_idle_claim_at`.
- Append `game_events.credits_claimed`.

No client-side credit math as source of truth.

#### `reveal-debuff`

Purpose:

- Reveal pending debuff when workout starts again.

Input:

```ts
{
  debuffId: string;
  sessionId: string;
}
```

Server responsibilities:

- Verify debuff belongs to user.
- Verify debuff status `pending_reveal`.
- Verify session belongs to user and is active.
- Set `status = active`, `revealed_at = now()`.
- Update `game_state.status = debuffed`.
- Append `game_events.debuff_revealed`.

MVP does not need location validation. GPS/wearable verification is outside MVP because complex anti-cheat and wearables are deferred.

#### `resolve-debuff`

Purpose:

- Resolve the single MVP debuff.

Input:

```ts
{
  debuffId: string;
  resolutionType: 'time' | 'workout_completion';
  sessionId?: string;
}
```

Server responsibilities:

- Validate status.
- Validate expiration or linked workout completion.
- Set `resolved_at`, `status = resolved`.
- Clear `game_state.current_debuff_id` if matching.
- Append event.

#### `start-prestige-attempt`

Purpose:

- Create a manual prestige attempt after eligibility check.

Input:

```ts
{
  targetExerciseId: string;
  targetMetric: 'estimated_1rm' | 'rep_pr';
}
```

Server responsibilities:

- Load `game_state` and user performance history.
- Call core-engine prestige eligibility.
- Create attempt snapshot.
- Append event.

#### `complete-prestige-attempt`

Purpose:

- Resolve prestige success/failure from a completed workout session.

Input:

```ts
{
  prestigeAttemptId: string;
  sessionId: string;
}
```

Server responsibilities:

- Verify attempt belongs to user.
- Verify completed session belongs to user.
- Call core-engine prestige result.
- On success:
  - increment prestige level
  - adjust entropy/credits as defined
  - clear or reset relevant calibration status if approved
- On failure:
  - apply MVP penalty/lockout
- Append game events.

The product concept says prestige is manual, requires threshold, and failure can penalize credits/lockout. Keep that server-owned.

### Deferred Edge Functions

- Nutrition sync.
- Wearable ingestion.
- GPS gym verification.
- Leaderboard verification.
- Monetization entitlement checks.
- Complex anti-cheat review.
- Multiple debuff assignment engine.
- Node tree unlock engine.

---

## 10. Client-Side vs Server-Side Responsibilities

### Client-Side Owns

- Active workout draft state in Zustand/local persistence.
- Fast set entry UX.
- Offline-safe creation of draft sessions/sets.
- Optimistic display for draft/in-progress workout data.
- TanStack Query reads/mutations.
- Rendering current server state.
- Submitting completion requests to Edge Functions.

### Client-Side Does Not Own

- Final Power awarded.
- Credits awarded/claimed.
- Prestige success/failure.
- Debuff assignment/reveal/resolution effects.
- Completed workout mutation.
- Calibration final status changes.
- Anti-cheat/anomaly decisions.

### Server-Side Owns

- Authenticated finalization.
- Transactional state changes.
- RLS enforcement.
- Append-only audit events.
- Idempotency.
- Immutable completion rules.
- Calling core-engine for final domain decisions.

### Database Owns

- Constraints.
- Ownership checks.
- RLS.
- Immutability triggers.
- Referential integrity.

---

## 11. Core-Engine Integration Points

The core-engine must stay pure TypeScript with no Supabase dependency. Workout math, calibration, progression, economy, debuffs, and prestige logic belong in `/packages/core-engine`.

Recommended modules:

```text
/packages/core-engine/src/workouts/
  calculateVolume.ts
  estimateOneRepMax.ts
  normalizeSetInput.ts

/packages/core-engine/src/calibration/
  calibrationState.ts
  evaluateExerciseCalibration.ts

/packages/core-engine/src/progression/
  recommendNextLoad.ts
  detectPlateau.ts

/packages/core-engine/src/economy/
  calculatePowerFromWorkout.ts
  convertPowerToCredits.ts
  calculateIdleCredits.ts

/packages/core-engine/src/debuffs/
  applyDebuffModifiers.ts
  evaluateDebuffResolution.ts

/packages/core-engine/src/prestige/
  evaluatePrestigeEligibility.ts
  evaluatePrestigeAttempt.ts
```

Function shape example:

```ts
calculateWorkoutCompletionResult(input): {
  totalVolume: number;
  powerAwarded: number;
  progressionUpdates: ProgressionUpdate[];
  calibrationUpdates: CalibrationUpdate[];
  gameEvents: GameEventDraft[];
}
```

Edge Functions adapt DB rows into typed core-engine inputs. Core-engine returns decisions. Edge Functions persist those decisions.

Do not import Supabase client, React Native, Expo, Zustand, or TanStack Query into core-engine.

---

## 12. Testing Strategy

### Migration/Database Tests

Required:

- All MVP tables exist.
- All tables have RLS enabled.
- User cannot select/insert/update another user’s rows.
- Built-in exercises readable by all authenticated users.
- Client cannot directly mutate `game_state`, `game_events`, `debuffs`, or `prestige_attempts`.
- Completed sessions cannot be edited.
- Completed sets cannot be edited.
- Idempotency keys prevent duplicate session/set inserts.

### Edge Function Tests

Required:

- `complete-workout-session` completes once and double-call does not double-award.
- Completion fails for another user’s session.
- Completion fails with no completed sets.
- Completion writes `game_events`.
- Active debuff modifies Power calculation.
- `claim-idle-credits` is idempotent.
- `start-prestige-attempt` fails when credits threshold not met.
- `complete-prestige-attempt` applies success/failure once.

### Core-Engine Unit Tests

Required:

- e1RM estimation edge cases.
- RPE progression rules:
  - Easy/Medium increase.
  - Hard holds.
  - Near Death reduces/caps.
- Calibration transitions:
  - uncalibrated → provisional.
  - provisional → calibrated after consistent performances.
  - prestige/long break can revert to provisional.
- Power calculation from volume.
- Credits conversion.
- Debuff modifier.
- Prestige eligibility/result.

### Mobile Integration Tests

Required later, but this story should prepare for:

- Offline draft created locally.
- Sync creates session/sets without duplicates.
- Completing session online locks records.
- Retrying completion does not duplicate rewards.
- App displays server-calculated results.

---

## 13. First Jira-Ready Implementation Story

### Title

Create Supabase MVP schema and server boundary foundation

### User Story

As the Overload system, I need a strict Supabase schema and server-owned mutation boundaries so workout logging, calibration, economy, debuffs, and prestige can ship without duplicated logic or unsafe data edits.

### Priority

P0

### MVP Status

MVP

### Components

Backend, Supabase, Core Engine, Data Integrity

### Labels

`mvp`, `supabase`, `rls`, `data-integrity`, `core-engine`, `offline-sync`

### Acceptance Criteria

- [ ] Supabase migrations create `profiles`, `equipment`, `exercises`, `workout_templates`, `workout_sessions`, `workout_sets`, `game_state`, `game_events`, `debuffs`, and `prestige_attempts`.
- [ ] Optional `body_metrics` is created only if onboarding requires it; nutrition is not implemented.
- [ ] All user-owned tables have RLS enabled.
- [ ] RLS prevents users from reading or mutating other users’ data.
- [ ] Built-in exercises are readable by authenticated users.
- [ ] `game_state`, `game_events`, `debuffs`, and `prestige_attempts` cannot be directly mutated by the mobile client.
- [ ] Completed workout sessions cannot be edited in place.
- [ ] Completed workout sets cannot be edited in place.
- [ ] Offline idempotency keys exist for workout sessions and sets.
- [ ] Required indexes are included.
- [ ] Edge Function stubs or contracts exist for workout completion, idle credit claim, debuff reveal/resolve, and prestige attempt start/complete.
- [ ] Server boundary docs explain that Edge Functions call `/packages/core-engine` for domain decisions.
- [ ] Migration/RLS tests are added or documented with runnable commands.

### Technical Notes

- Do not implement nutrition, social, leaderboards, watch, monetization, complex anti-cheat, multiple debuffs, or multiple prestige modes.
- Do not put final Power/Credit/prestige/debuff decisions in mobile code.
- Do not duplicate core-engine logic inside Edge Functions. Edge Functions orchestrate and persist.

### QA Notes

- Test two users.
- Test completed workout immutability.
- Test client attempts to update game balances fail.
- Test duplicate completion request does not double-award.

### Dependencies

- Supabase project/local dev environment.
- Auth enabled.
- Initial core-engine type contracts, even if functions are stubs.

---

## 14. Risks and Scope Traps

### Risk: JSON in `workout_templates` Becomes Permanent Spaghetti

MVP can tolerate constrained `planned_exercises`, but it needs validation. If template editing grows, split into `workout_template_exercises` immediately.

### Risk: Mobile Calculates Economy “Temporarily”

No. That becomes permanent. Mobile may show estimates, clearly labeled as estimates. Server result wins.

### Risk: Edge Functions Duplicate Core-Engine Logic

Also no. Edge Functions should import/call shared pure functions or package build output. If that is awkward, fix package setup instead of copying math.

### Risk: Completed Workout Corrections Are Ignored

Even if correction UI is deferred, schema must support correction versions. Silent edits are a data integrity bug.

### Risk: RLS Added “Later”

Not acceptable. Tables without RLS are a blocker.

### Risk: Anti-Cheat Scope Creep

GPS, wearables, photo verification, public failure stats, and manual review are not MVP. Keep only basic anomaly-safe immutability and audit logs.

### Risk: Debuff System Overbuild

One debuff type. One lifecycle. No random locked exercises or forced rep ranges until the MVP loop proves itself.

### Risk: Prestige Mode Creep

One manual prestige flow. No retries, monetized shields, public stats, or multiple modes.

---

## Cursor Handoff Notes

Create:

```text
supabase/migrations/001_create_profiles.sql
supabase/migrations/002_create_equipment_exercises.sql
supabase/migrations/003_create_workouts.sql
supabase/migrations/004_create_game_state_events.sql
supabase/migrations/005_create_debuffs_prestige.sql
supabase/migrations/006_add_indexes_rls.sql

supabase/functions/complete-workout-session/
supabase/functions/claim-idle-credits/
supabase/functions/reveal-debuff/
supabase/functions/resolve-debuff/
supabase/functions/start-prestige-attempt/
supabase/functions/complete-prestige-attempt/

docs/architecture/supabase-mvp-schema.md
docs/architecture/server-boundaries.md
```

Do not create:

- Nutrition tables.
- Squads/social/leaderboards.
- Wearable tables.
- Subscription tables.
- Node tree tables.
- Multiple debuff subtype tables.
- Generic JSON “state” blobs for the whole game.

This is the foundation. Keep it boring, strict, and hard to corrupt.
