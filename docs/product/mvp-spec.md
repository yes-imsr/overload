# Overload MVP Spec and Scope Guard

## Status

Source of truth for MVP implementation scope.

This document defines what the first shippable version of Overload must prove, what it must not include, and how PM, architecture, development, and QA should reject scope creep.

## Product Summary

Overload is a React Native + Expo mobile workout tracker fused with an idle progression game.

North star:

> I lift, the system reacts, and my progress has consequences.

The game layer must amplify real workout logging. It must not replace training with idle-only progress.

## MVP Loop

The MVP proves one complete loop:

1. User creates an account.
2. User creates a training profile.
3. User adds available equipment.
4. User starts a workout.
5. User logs sets quickly with weight, reps, and effort.
6. Logged output updates calibration and progression.
7. Workout output generates Power.
8. Power converts into claimable Credits over time.
9. Credits are spent on one or more simple nodes.
10. Missed work or instability can trigger one safe debuff loop.
11. User can attempt one prestige event once eligible.

If a feature does not directly support this loop, it is deferred.

## MVP Must Include

- Supabase Auth and persistence.
- Intro / Welcome.
- Training profile setup.
- Equipment setup.
- Starter workout templates or starter workout generation.
- Today's Workout.
- Active workout logging.
- Set logging with weight, reps, and effort rating.
- Effort labels: Easy, Medium, Hard, Near Death.
- Calibration state per exercise.
- Simple auto progression.
- Power generated from workout output.
- Credits generated and claimed from Power over time.
- Basic node economy.
- One safe debuff loop.
- One prestige attempt flow.
- Core engine unit tests.
- Basic QA regression path.

## MVP Success Criteria

QA must be able to complete this path:

1. Create an account.
2. Build a training profile.
3. Add equipment.
4. Start a workout.
5. Log sets quickly.
6. Receive calibration and progression updates.
7. Earn Power.
8. Convert Power into Credits.
9. Spend Credits on one or more nodes.
10. Experience and resolve one debuff.
11. Attempt one prestige event.
12. Confirm completed workout history remains immutable.

## Explicitly Deferred

The following are not MVP:

- Social feed.
- Squads.
- Friends.
- Leaderboards.
- Tournaments.
- Watch app.
- Wearable integrations.
- Health platform integrations.
- Nutrition tracking.
- Monetization polish.
- Subscriptions.
- Store / battle pass.
- Deep cosmetics.
- Multiple debuff types.
- Complex node trees.
- Complex anti-cheat.
- Advanced analytics.
- Public prestige stats.

These may be important later, but they do not ship in MVP unless PM/Architecture explicitly reopens scope.

## Scope Creep Rule

Any feature, table, route, component, copy system, or background process that does not directly prove the MVP loop is scope creep.

Default response:

1. Mark it Deferred.
2. Do not implement it in MVP work.
3. If it keeps coming up, create a Deferred Linear issue with clear rationale.
4. Do not hide deferred work inside broad MVP stories.

If everything becomes urgent, nothing is urgent. MVP priority is reserved for work that unlocks the core loop.

## Architecture Ownership

### Mobile App Owns

- UI screens.
- Navigation.
- Local active workout draft state.
- Input collection.
- Basic form validation.
- Calling Supabase and trusted actions.
- Rendering returned system state.

Mobile app must not own workout or game formulas.

### Core Engine Owns

- e1RM estimation.
- Calibration state transitions.
- Auto progression rules.
- Power generation.
- Credit conversion helpers.
- Entropy calculations.
- Debuff rules.
- Prestige eligibility and result helpers.

Core-engine functions must be deterministic and unit-testable.

### Supabase Owns

- Auth.
- Persistence.
- RLS.
- Database constraints.
- Completed workout immutability enforcement.
- Game state persistence.
- Debuff persistence.
- Prestige attempt persistence.

### Edge Functions Own

Trusted server actions only, including:

- Completing workout sessions.
- Applying progression updates.
- Claiming Credits.
- Assigning or resolving debuffs.
- Starting or resolving prestige attempts.

Do not use Edge Functions for simple reads that RLS can safely handle.

## QA Enforcement

Codex should fail PRs when:

- Deferred features are added.
- Acceptance criteria are vague or missing.
- Business math appears in React Native screens.
- Core-engine logic lacks unit tests.
- Completed workout immutability is violated.
- Supabase schema lacks RLS expectations.
- Design tokens are bypassed.
- Implementation is fake, stubbed, or too vague to validate.

## Related Documents

- Product brief: `docs/product/OVERLOAD_PRODUCT_BRIEF.md`
- Engineering MVP scope: `docs/dev/MVP_SCOPE.md`
- Architecture plan: `docs/architecture/ARCHON_ARCHITECTURE.md`
- Design system: `docs/design/DESIGN_SYSTEM.md`
- QA docs: `docs/qa/`
