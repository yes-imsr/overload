# MVP Screen Inventory

Source alignment:
- `docs/dev/MVP_SCOPE.md`
- `docs/product/OVERLOAD_PRODUCT_BRIEF.md`
- `docs/design/DESIGN_SYSTEM.md`

## MVP screen list

This issue defines navigation inventory only. It does not implement new screens.

1. Welcome
2. Training Profile
3. Equipment Setup
4. Home / Command Center
5. Today's Workout
6. Active Workout Logger
7. Calibration
8. Nodes / Idle Economy
9. System Task (safe debuff/stability flow)
10. Prestige Attempt
11. Profile Stats

Notes:
- `System Task` maps to the single MVP debuff/recovery flow (safe language: Stability Task / Recovery Challenge).
- `Profile Stats` maps to profile + basic history/meta only.

## Priority order (next action first)

Primary ordering for route planning and CTA prominence:

1. Active Workout
2. System Task
3. Claimable Reward
4. Calibration
5. History
6. Settings

Interpretation for MVP:
- `Claimable Reward` = Nodes / Credits claim action.
- `History` = Profile Stats history summary.
- `Settings` stays within Profile surface for MVP (no standalone deferred settings suite).

## Deferred screen guardrail

Do not add non-MVP screens in this inventory, including:
- Social / Friends / Squads
- Leaderboards / Tournaments
- Watch / Wearables
- Nutrition / Meals
- Store / Subscriptions / Monetization
- Multi-debuff systems or multiple prestige modes

## Route planning note

Current route shells in `apps/mobile/app/` may use placeholders while stories are implemented. Inventory and ordering above are the source for MVP route planning.
