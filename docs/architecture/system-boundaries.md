# System Boundaries

## Purpose

This document defines the ownership boundaries for the Overload MVP. It exists so mobile UI, shared core logic, Supabase persistence, and Edge Functions do not blur responsibilities.

The MVP core loop is:

> Workout logging → calibration/progression → Power/Credits → nodes → one safe debuff → one prestige attempt.

Anything outside that loop is deferred unless explicitly reopened by PM/Architecture.

## Non-Negotiable Boundary Rule

Workout math, progression logic, economy math, debuff rules, and prestige rules belong in `packages/core-engine` or trusted server orchestration that calls `packages/core-engine`.

React Native screens may collect input and render results. They must not own business formulas.

## Layer Ownership Summary

| Layer | Owns | Must Not Own |
|---|---|---|
| `apps/mobile` | Screens, navigation, input, local workout drafts, optimistic UI, TanStack Query calls, Zustand draft state, design-system rendering | Final workout math, Power/Credits formulas, Entropy rules, debuff assignment, prestige success/failure, direct balance mutation |
| `packages/core-engine` | Deterministic TypeScript rules for workout output, calibration, progression, Power, Credits, Entropy, debuff helpers, prestige eligibility/results | React Native components, Supabase clients, network calls, auth, persistence, clocks that cannot be injected/tested |
| `supabase/migrations` | Tables, constraints, indexes, RLS, immutability enforcement, auditability | Business formulas hidden in ad hoc SQL when they should be testable in core-engine |
| `supabase/functions` | Trusted server actions that validate/authenticate mutations and call core-engine rules | Simple reads/writes that do not need trusted orchestration, UI state, untested duplicated formulas |
| `docs/` | Product, architecture, design, QA, and agent operating rules | Runtime business logic |

## Mobile App Boundary

The mobile app owns the experience layer.

It may:

- Render MVP screens with Expo Router.
- Collect onboarding, equipment, workout, set, effort, node, debuff, and prestige inputs.
- Hold active workout drafts locally before completion.
- Use Zustand for draft workout state.
- Use TanStack Query for server state reads/mutations.
- Perform basic client-side form validation for UX.
- Show optimistic UI only when the server can safely reconcile the result.
- Display outputs returned by core-engine or Supabase trusted actions.

It must not:

- Calculate final Power awards inside screens.
- Calculate final Credit claims inside screens.
- Assign or resolve debuffs inside screens.
- Decide prestige success/failure inside screens.
- Mutate completed workout sessions or completed sets directly.
- Directly update `game_state` balances.
- Duplicate workout/game formulas already defined in `packages/core-engine`.
- Add deferred systems such as social, squads, leaderboards, watch integrations, nutrition, monetization, complex anti-cheat, multiple debuffs, or complex node trees.

### Mobile Local Draft Rule

Active workout drafts may be mutable locally while the workout is not completed.

Once the user completes a workout, the app sends the draft to a trusted completion path. After completion, the app treats the persisted workout session and sets as read-only.

## Core Engine Boundary

`packages/core-engine` owns deterministic rules and calculations.

It should expose pure TypeScript functions for:

- e1RM estimation.
- Calibration status transitions.
- Readiness-to-progress checks.
- Auto progression recommendations.
- Power generation calculations.
- Power-to-Credits conversion helpers.
- Entropy calculations.
- Debuff assignment and resolution helpers.
- Prestige eligibility checks.
- Prestige success/failure calculation helpers.

Core-engine functions must be:

- Deterministic.
- Unit-testable.
- Free of UI dependencies.
- Free of Supabase client dependencies.
- Free of direct network calls.
- Explicit about inputs and outputs.
- Safe around edge cases such as zero reps, missing calibration, stale calibration, failed sets, and Near Death effort.

Core-engine may accept injected timestamps or elapsed time values. It must not rely on hidden global clock behavior for test-sensitive calculations.

## Supabase Database Boundary

Supabase owns persistence, user isolation, integrity, and security.

Supabase should persist:

- Auth-owned user identity.
- Profiles and training profile state.
- Equipment.
- Exercises.
- Workout templates.
- Workout sessions.
- Workout sets.
- Exercise calibration state.
- Game state.
- Game events.
- Nodes and user nodes.
- Debuffs.
- Prestige attempts.

Supabase must enforce:

- Row-Level Security on MVP tables.
- User-owned row access through `auth.uid()`.
- Strict check constraints for known enum-like values.
- Completed workout immutability.
- Append-only behavior for audit-style event rows where applicable.
- Server-controlled mutation paths for balances, debuffs, prestige, and completed workout corrections.

Supabase must not become a dumping ground for opaque JSON state when relational state is required for QA, RLS, or future debugging.

JSON is acceptable only for constrained metadata or temporary MVP compromise where the schema shape is documented and validated.

## Completed Workout Immutability Rule

Completed workout sessions are immutable.

After a workout session reaches `completed`:

- `workout_sessions` must not be edited directly by the client.
- `workout_sets` linked to the completed session must not be edited directly by the client.
- Any correction must create a new version, adjustment record, or controlled correction path.
- Game/economy changes caused by the correction must be captured in `game_events` or equivalent audit records.

Reason:

- Prevents easy client-side cheating.
- Makes progression calculations reproducible.
- Keeps QA regression paths stable.
- Keeps debuff/prestige outcomes explainable.
- Allows future anti-cheat without rewriting the MVP data model.

Draft or in-progress sessions may be mutable before completion.

## Edge Function Boundary

Use Supabase Edge Functions only for trusted server actions.

Edge Functions may own orchestration for:

- Completing a workout session.
- Applying calibration/progression updates.
- Awarding Power from completed workout output.
- Claiming Credits from elapsed idle production.
- Purchasing or upgrading nodes when balances change.
- Assigning the single MVP debuff.
- Revealing or resolving the single MVP debuff.
- Starting a prestige attempt.
- Resolving a prestige attempt.
- Applying correction records to completed workout history.

Edge Functions should:

- Validate the authenticated user.
- Load required Supabase records.
- Call `packages/core-engine` logic for deterministic calculations when available.
- Write database changes transactionally where possible.
- Write audit events for economy, debuff, prestige, and correction changes.
- Return display-ready results to the mobile app.

Edge Functions should not:

- Reimplement formulas separately from core-engine.
- Contain UI formatting beyond simple response shape.
- Be used for simple reads that TanStack Query can perform safely through RLS.
- Introduce non-MVP systems.

## Data Flow: Completing a Workout

1. User logs sets in `apps/mobile` as a local draft.
2. User explicitly completes the workout.
3. Mobile sends the draft/session payload to a trusted completion path.
4. Trusted server path validates ownership and input shape.
5. Server calls core-engine to calculate workout output, calibration/progression changes, Power, Entropy impact, and any MVP debuff eligibility.
6. Server writes completed session, completed sets, game state changes, calibration updates, and game events.
7. Mobile receives the server result and renders updated system state.

Mobile must not calculate or persist final economy results on its own.

## Data Flow: Claiming Credits

1. Mobile requests a Credit claim.
2. Server loads `game_state` and elapsed idle production inputs.
3. Server calls core-engine Credit conversion helpers.
4. Server updates Credit balance and claim timestamp.
5. Server writes a `game_events` row.
6. Mobile displays the returned balance and claim result.

The client may preview claimable Credits for UX, but the server result is authoritative.

## Data Flow: Debuff MVP

The MVP supports one safe debuff loop only.

Allowed language:

- Stability Task
- Recovery Challenge
- Overload Task
- Bonus Set

Avoid:

- Punishment set
- Shame language
- Unsafe exertion pressure
- Random high-risk exertion demands

Debuff assignment and resolution are trusted server actions. Mobile renders the debuff state and collects safe completion input only.

## Data Flow: Prestige MVP

Prestige must be explicit, manual, and recoverable.

1. Mobile displays eligibility returned by server/core-engine logic.
2. User explicitly confirms the attempt.
3. Server starts a `prestige_attempts` record.
4. User completes the required calibrated performance path.
5. Server resolves success/failure using core-engine helpers.
6. Server writes game state changes and audit events.
7. Mobile renders result and next state.

Mobile must not locally decide prestige outcome.

## QA Enforcement Rules

Codex must fail PRs when:

- Business math appears in React Native screens.
- Core logic is not covered by unit tests.
- Completed workout sessions or sets can be edited directly after completion.
- Supabase MVP tables lack RLS expectations.
- Client code directly mutates balances, debuffs, or prestige outcomes.
- Deferred features are added to MVP work.
- Design tokens are bypassed with random colors.
- Implementation is fake, stubbed, or too vague to validate.

## Cursor Implementation Rules

Cursor must:

- Read the Linear issue before coding.
- Keep implementation inside the issue scope.
- Put deterministic workout/game rules in `packages/core-engine`.
- Keep UI screens focused on rendering and input.
- Add or update tests for core-engine logic.
- Preserve completed workout immutability.
- Include typecheck and test results in PRs.

## Deferred Scope Guard

The following remain deferred for MVP:

- Social feed.
- Squads.
- Friends.
- Leaderboards.
- Tournaments.
- Watch app.
- Wearable integrations.
- Nutrition tracking.
- Monetization polish.
- Subscriptions.
- Deep cosmetics.
- Multiple debuff types.
- Complex node trees.
- Complex anti-cheat.
- Photo verification.
- Public ranking systems.
- AI coaching chat.

If any of these appear in a PR linked to an MVP issue, treat it as scope creep unless PM/Architecture explicitly reopened it.
