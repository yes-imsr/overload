# MVP Screen Inventory

Linear issue: OVR-14

## Purpose

This document defines the MVP navigation inventory before full UI implementation. It is route-planning guidance only; OVR-14 does not implement screens or add product scope.

Every MVP surface must make the user's most important next action obvious and follow the black-first reactor-console design system in `docs/design/DESIGN_SYSTEM.md`.

## MVP Screens

| Screen | MVP role | Primary next action |
|---|---|---|
| Welcome | Introduce Overload and start account/onboarding flow. | Initialize training system |
| Profile | Collect the user's training profile inputs. | Build training profile |
| Equipment | Capture available equipment for workout generation. | Save equipment |
| Home | Command center for current system state and next action. | Resolve the highest-priority available action |
| Today Workout | Preview the assigned workout and expected system impact. | Start workout |
| Active Logger | Log current sets with weight, reps, and effort quickly. | Complete set / finish workout |
| Calibration | Explain calibration state and what signal is needed next. | Continue training / review load model |
| Nodes | Show the basic Credits and node economy loop. | Claim Credits / activate node |
| System Task | Present the single safe MVP Stability Task when needed. | Accept or complete Stability Task |
| Prestige | Handle one explicit MVP prestige attempt flow. | Begin / confirm prestige attempt |
| Profile Stats | Show basic user progress, completed history entry points, and account details. | Review progress / manage profile |

## Global Action Priority

When multiple states compete for attention, Home and any command surface must rank them in this order:

1. **Active workout** - resume active logging before anything else.
2. **System task** - resolve an assigned Stability Task or blocking risk state.
3. **Claimable reward** - claim available Credits or node output.
4. **Calibration** - review calibration gaps or stale model prompts.
5. **History** - review completed workouts and basic progress after current actions are clear.
6. **Settings** - account/profile settings stay lowest priority and never displace the MVP loop.

History and settings are priority categories, not additional standalone MVP screens in this inventory. They should live under Profile Stats or a secondary profile/account area until a future issue explicitly expands navigation.

## Navigation Planning Notes

- Welcome, Profile, and Equipment form the onboarding path.
- Home is the default signed-in command surface.
- Today Workout and Active Logger belong to the workout flow; Active Logger can be resumed from Home if a draft workout exists.
- Calibration, Nodes, System Task, Prestige, and Profile Stats are reachable from Home or bottom navigation depending on implementation constraints.
- System Task represents the one safe MVP debuff/Stability Task loop only.
- Prestige represents one MVP prestige attempt only.
- Screens must render values returned by core-engine, Supabase, or trusted actions; no workout math, economy math, debuff rules, or prestige outcomes belong in UI screens.

## Scope Guard

No deferred screens are part of this inventory. Do not add social, friends, squads, leaderboards, tournaments, watch/wearable, nutrition, monetization/store, deep cosmetic, AI coaching, public stats, photo verification, complex anti-cheat, multiple-debuff, or complex node-tree routes for the MVP without a new approved Linear issue.

## Acceptance Checklist

- [x] Screen list includes welcome, profile, equipment, home, today workout, active logger, calibration, nodes, system task, prestige, and profile stats.
- [x] Priority order is active workout, system task, claimable reward, calibration, history, settings.
- [x] Deferred screens are excluded from the MVP inventory.
