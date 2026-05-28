# Overload MVP Regression Checklist

Use this checklist for every MVP PR and release candidate. A PR fails QA if any acceptance criterion is incomplete, unverifiable, outside MVP scope, or implemented in the wrong architectural layer.

## Review Inputs

- [ ] Linked Linear issue was reviewed.
- [ ] Acceptance criteria were copied into the QA notes and checked directly.
- [ ] Architecture notes were reviewed for affected layers.
- [ ] QA notes were reviewed for story-specific risks.
- [ ] MVP scope was checked against `docs/dev/MVP_SCOPE.md`.
- [ ] Changed files were inspected for product scope, architecture boundaries, and regression risk.

## End-to-End MVP Path

### Account Creation

- [ ] New user can create an account through the MVP auth flow.
- [ ] Authenticated user lands in the correct onboarding or app state.
- [ ] Profile bootstrap creates only the required MVP records.
- [ ] A second user cannot access the first user's profile or app data.

### Profile

- [ ] User can create or complete the basic profile required by onboarding.
- [ ] Profile includes only MVP-needed training data.
- [ ] Profile data persists after app reload or restart.
- [ ] Profile changes do not trigger game economy or workout math in UI code.

### Equipment

- [ ] User can add the MVP equipment needed for workout setup.
- [ ] Equipment fields support weight unit, availability, and increments where implemented.
- [ ] Equipment choices affect workout setup without adding non-MVP equipment systems.
- [ ] Equipment data persists after app reload or restart.

### Session Entry

- [ ] User can start today's workout or an MVP workout session.
- [ ] In-progress session state is visible and recoverable.
- [ ] Local draft state does not create duplicate sessions during retry or reload.
- [ ] Session ownership is enforced by Supabase RLS or documented local equivalent if backend is not in the story.

### Set Entry

- [ ] User can enter weight, reps, and RPE for a set.
- [ ] RPE options match MVP labels: Easy, Medium, Hard, Near Death.
- [ ] Set entry is fast and does not require deferred features.
- [ ] Invalid or impossible set inputs are rejected or safely handled.
- [ ] Set records do not duplicate during retry or reload.

### Completion

- [ ] User can complete a workout session with at least one completed set.
- [ ] Completion locks the session from direct editing.
- [ ] Completion locks completed sets from direct editing.
- [ ] Any correction flow creates a revised version, adjustment record, or explicit server-controlled correction path.
- [ ] Completion writes or prepares the data needed for calibration, progression, Power, Credits, and game events.

### Calibration

- [ ] Per-exercise calibration state updates from completed workout data.
- [ ] Internal calibration states stay within MVP scope: `uncalibrated`, `provisional`, `calibrated`, `stale`.
- [ ] UI labels stay within MVP scope: Learning, Calibrating, Stable, Stale.
- [ ] e1RM or calibration math is owned by `packages/core-engine`, not UI code.
- [ ] Unit tests cover calibration transitions and edge cases for changed rules.

### Progression

- [ ] Post-workout recommendation is based on completed reps and RPE.
- [ ] Easy or Medium recommends weight increase or added reps.
- [ ] Hard recommends holding.
- [ ] Near Death recommends reducing next session or capping reps.
- [ ] Plateau detection follows the MVP rule of 3 failed sessions where implemented.
- [ ] Progression math is owned by `packages/core-engine`, not mobile UI.

### Power

- [ ] Completed workout output produces Power through core-engine logic.
- [ ] Power award is server-owned or clearly marked as an estimate until server confirmation.
- [ ] Active debuff modifiers are applied by shared domain logic, not duplicated in UI.
- [ ] Power changes are persisted and auditable through game state/events where backend is in scope.

### Credits

- [ ] User can claim or receive Credits from Power through the MVP economy path.
- [ ] Credit conversion and idle claim rules are owned by core-engine/server orchestration.
- [ ] Credit balance cannot be directly changed by mobile client code when Supabase is in scope.
- [ ] Credit claim retry is idempotent or has a documented no-duplicate path.

### Node Upgrade

- [ ] User can view the MVP node list or simple node chain.
- [ ] User can spend Credits on a node upgrade.
- [ ] Upgrade cost, effect, and balance updates are calculated outside UI presentation code.
- [ ] Node upgrade persists after app reload or restart.
- [ ] Implementation does not add complex tech trees, loot, cosmetics, stores, or other deferred systems.

### Stability Task

- [ ] One MVP debuff or Stability Task can be assigned, revealed, active, and resolved.
- [ ] Language remains safe: Stability Task, Recovery Challenge, Overload Task, or Bonus Set.
- [ ] Flow avoids shame-based or unsafe exercise punishment language.
- [ ] Only one MVP debuff type or lifecycle is introduced unless the issue explicitly says otherwise.
- [ ] Resolution updates game state/events and persists after reload.

### Prestige

- [ ] User can view one manual Prestige Attempt path.
- [ ] Eligibility checklist is visible before confirmation.
- [ ] Confirmation step exists before starting the attempt.
- [ ] Success and failure states are handled.
- [ ] Consequences are clear and persisted.
- [ ] Prestige eligibility and result rules are owned by core-engine/server orchestration.
- [ ] Implementation does not add multiple prestige modes, monetized retries, public stats, or other deferred scope.

### Reload Persistence

- [ ] Reloading or restarting preserves auth state as expected.
- [ ] Profile and equipment persist.
- [ ] In-progress workout draft can be recovered or safely discarded with clear state.
- [ ] Completed workout remains completed and immutable.
- [ ] Calibration, progression, Power, Credits, node upgrades, active Stability Task, and prestige state persist.
- [ ] Retrying after reload does not duplicate sessions, sets, rewards, credits, debuffs, or prestige results.

## Architecture Checks

### Business Logic Boundaries

- [ ] No final workout math is implemented in React, React Native, Expo routes, or UI components.
- [ ] No final game economy math is implemented in UI code.
- [ ] No final prestige, debuff, calibration, or progression rules are implemented only in mobile code.
- [ ] `packages/core-engine` remains pure TypeScript with no React, React Native, Expo, Supabase client, or UI dependencies.
- [ ] Edge Functions or server calls orchestrate validated mutations and call core-engine for domain decisions where backend is in scope.

### Completed Session Immutability

- [ ] Completed `workout_sessions` cannot be edited in place.
- [ ] Completed `workout_sets` cannot be edited or deleted in place.
- [ ] Corrections use versioning, adjustment records, or a controlled server-only correction path.
- [ ] Completed workout mutation attempts are covered by tests or documented manual verification.

### RLS Expectations

- [ ] Every Supabase table introduced or changed in the PR has RLS enabled.
- [ ] User-owned rows are scoped to `auth.uid()`.
- [ ] Built-in exercise access is read-only and does not expose another user's custom data.
- [ ] Client cannot directly mutate `game_state`, `game_events`, `debuffs`, or `prestige_attempts`.
- [ ] Two-user access checks are tested or documented when Supabase changes are included.

### MVP Scope Guard

- [ ] No social feed, friends, squads, comments, sharing, leaderboards, tournaments, or seasons.
- [ ] No watch app, wearables, heart rate tracking, photo verification, or advanced anti-cheat.
- [ ] No nutrition logs, meal tracking, calories/protein tracking, or nutrition integrations.
- [ ] No deep cosmetics, avatars, skins, loot crates, store, subscriptions, or battle pass.
- [ ] No complex node trees, multiple debuff types, or multiple prestige modes.
- [ ] No fake screens, stubbed success paths, hard-coded pass states, or unverifiable implementations.

## Required Command Checks

Run from the repository root unless the Linear issue documents a narrower command.

```text
pnpm install
pnpm run typecheck
pnpm test
pnpm run lint
```

If install is already current, report that it was not rerun and why. If `lint` is not configured, report `Not configured` only after checking `package.json`.

## Required QA Report Format

Use this format for PR QA comments and release candidate notes.

```text
Verdict: Pass

Summary:
- ...

Linear issue reviewed:
- OVR-XX: ...

Acceptance criteria checklist:
- [x] ...
- [ ] ...

Commands run:
- pnpm install: Pass/Fail/Skipped, reason
- pnpm run typecheck: Pass/Fail
- pnpm test: Pass/Fail
- pnpm run lint: Pass/Fail/Not configured

Test results:
- ...

Bugs / gaps found:
- ...

Required fixes:
- ...

Regression notes:
- ...

Merge recommendation:
- @cursoragent, this passed qa, merge pr request.
```

For a failing review, the first line must be exactly:

```text
Verdict: Fail
```

and the merge recommendation must be:

```text
@cursoragent, this failed qa, please review and fix.
```

## Pass/Fail Rule

Pass only when every applicable acceptance criterion is complete, required commands pass, architecture boundaries hold, MVP scope is protected, and the implementation can be verified. Fail if any required check is missing, fake, fragile, unverifiable, out of scope, or implemented in the wrong layer.
