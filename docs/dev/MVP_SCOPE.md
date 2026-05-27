# Overload — MVP Scope

**Status:** Source of truth for MVP engineering boundaries  
**Audience:** Product, architecture, engineering, QA

---

## MVP Goal

Ship the smallest complete version of Overload that proves the core loop:

> User logs real workouts → system adapts training → effort generates Power → Power converts into Credits → game consequences create tension.

The MVP must validate that Overload feels like a credible training app with a minimal idle game layer, not a generic habit tracker or bloated RPG.

---

## MVP Includes

### 1. Onboarding

Required:

- Intro / Welcome screen
- Training profile setup
- Equipment setup
- Basic user profile creation
- Persist onboarding completion

Training profile should collect only what is needed to generate early workout targets:

- Training experience
- Training focus
- Available equipment
- Basic schedule / training days

Do not turn onboarding into a long survey.

---

### 2. Workout Logging

Required:

- Today's Workout screen
- Active Workout Logger
- Weight input
- Reps input
- RPE selection
- Complete set action
- Rest timer
- Previous performance display where available
- Local draft state before sync
- Completed session state

RPE labels:

- Easy
- Medium
- Hard
- Near Death

Workout logging must be fast. The Active Workout screen is the most important MVP screen.

---

### 3. Calibration

Required:

- Per-exercise calibration state
- Basic e1RM estimate
- Calibration Status screen
- State updates after logged workouts

Internal states are exactly:

- `uncalibrated`
- `provisional`
- `calibrated`
- `stale`

UI labels:

- `Learning`
- `Calibrating`
- `Stable`
- `Stale`

Do not add extra calibration states during MVP.

---

### 4. Auto Progression

Required:

- Basic post-workout adjustment rules
- Progression based on RPE and completed reps
- Hold/reduce/increase recommendation
- Plateau detection after 3 failed sessions
- Basic deload suggestion only if needed

Rules:

- Easy / Medium → increase weight 2.5–5% or add 1–2 reps
- Hard → hold
- Near Death → reduce next session 2.5% or cap reps

Progression math belongs in `packages/core-engine`.

---

### 5. Game Economy

Required:

- Power earned from workout output
- Credits generated or claimed from Power
- Entropy as basic risk/prestige pressure
- Nodes / Idle Economy screen
- One simple node chain or node list
- Basic claim action

MVP economy should be small and understandable.

Do not build a complex tech tree.

---

### 6. Debuff Loop

Required:

- One debuff type
- Debuff Reveal screen or route-level state
- Debuff active state on Home
- Safe recovery action
- Clear debuff flow

Use safe language:

- Stability Task
- Recovery Challenge
- Overload Task
- Bonus Set

Do not use unsafe or shame-based language.

---

### 7. Prestige Loop

Required:

- One Prestige Attempt screen
- Eligibility checklist
- Confirmation step
- Success state
- Failure state
- Clear consequences

Prestige should feel high-stakes but simple.

Do not add multiple prestige modes.

---

### 8. Backend Foundation

Required:

- Supabase project integration
- Auth foundation
- Profile bootstrap
- MVP database schema
- RLS policies
- Migration files
- Client/server boundary documented

Minimum tables:

- profiles
- equipment
- exercises
- workout_templates
- workout_sessions
- workout_sets
- game_state
- game_events
- debuffs
- prestige_attempts

Optional only if needed:

- body_metrics

Deferred:

- nutrition_logs

---

### 9. Shared Core Engine

Required:

All workout and game math lives in `packages/core-engine`.

Core engine owns:

- e1RM calculation
- calibration state transitions
- progression adjustment
- plateau detection
- Power calculation
- Credits conversion
- debuff rules
- prestige eligibility
- prestige resolution

Core engine must be pure TypeScript.

No React.
No React Native.
No Expo.
No Supabase client.
No UI logic.

---

## MVP Excludes

The following are explicitly out of scope:

- Social feed
- Friends
- Squads
- Comments
- Sharing
- Leaderboards
- Tournaments
- Seasons
- Watch app
- Wearables
- Heart rate tracking
- Photo verification
- Advanced anti-cheat
- Nutrition integrations
- Meal tracking
- Calories/protein tracking
- Deep cosmetics
- Avatars
- Skins
- Loot crates
- Store
- Subscriptions
- Battle pass
- Complex node trees
- Multiple debuff types
- Multiple prestige modes

If any of these appear in Jira, architecture, or implementation work, flag them as scope creep.

---

## MVP Screen List

Required screens:

1. Intro / Welcome
2. Training Profile Selection
3. Equipment Setup
4. Home / Command Center
5. Today's Workout
6. Active Workout Logger
7. Calibration Status
8. Nodes / Idle Economy
9. Debuff Reveal
10. Prestige Attempt
11. Profile / Stats

If scope must shrink, combine Debuff Reveal as a Home overlay state and defer full Prestige polish, but keep the basic prestige logic.

---

## Data Integrity Rules

- Completed workout sessions are immutable.
- Edits to completed workouts create revised versions or adjustment records.
- Game economy changes should be recorded as events where practical.
- Progression, prestige, and debuff rules must not rely only on client-side validation.
- User-owned data must be protected by Supabase RLS.

---

## Technical Boundaries

### Mobile App

Path:

`apps/mobile`

Owns:

- screens
- navigation
- UI components
- local workout draft state
- API calls
- loading/error/empty states

Does not own:

- workout math
- game math
- prestige rules
- debuff rules

### Core Engine

Path:

`packages/core-engine`

Owns:

- workout math
- game math
- progression rules
- calibration logic
- typed domain models

Must be testable with Vitest.

### Supabase

Path:

`supabase`

Owns:

- database schema
- migrations
- RLS
- server-trusted logic boundaries
- Edge Function stubs where needed

---

## MVP Acceptance

MVP is valid when:

- User can complete onboarding.
- User can log a full workout.
- Workout creates Power.
- Power can become Credits.
- Calibration state updates for at least one exercise.
- Auto progression produces next-session recommendations.
- One debuff can trigger and clear.
- One prestige attempt can succeed or fail.
- Profile/game/workout data persists through Supabase.
- Core logic has unit tests.
- App follows the Overload design system.

---

## Decision Rule

When in doubt:

1. Protect safety.
2. Protect workout logging speed.
3. Protect MVP scope.
4. Keep logic testable.
5. Keep UI serious, minimal, and system-driven.