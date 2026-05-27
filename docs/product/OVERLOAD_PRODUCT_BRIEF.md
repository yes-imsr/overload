# Overload — Product Brief

**Status:** Source of truth (MVP)  
**Audience:** Product, design, engineering, QA

---

## One-liner

Overload is a **mobile workout tracker fused with an idle progression game**. It must feel like a serious training app infected by a minimalist reactor / control-system game.

---

## North star

> **I lift, the system reacts, and my progress has consequences.**

The player is not grinding for cosmetic badges. They are operating a system that reads real training input and feeds an idle economy with real tradeoffs.

---

## Core fantasy

| Layer | Player experience |
|-------|-------------------|
| **Training** | Fast, credible workout logging with calibration and auto-progression |
| **System** | A command-center UI that surfaces load, stability, and readiness |
| **Consequence** | Power from effort converts to Credits; debuffs and prestige create risk |

Overload rewards consistency and honest effort. The game layer amplifies training—it does not replace it.

---

## Target user

- Lifts with barbell / dumbbell / machine focus
- Wants progression without spreadsheet overhead
- Tolerates (or enjoys) light game pressure: idle claims, one debuff, one prestige loop
- Values clarity over hype

Not targeting: social lifters, nutrition-first users, wearable-only workflows, or competitive leaderboard grinders in MVP.

---

## Product pillars

### 1. Credible training loop

- Log sets quickly: weight, reps, RPE
- Calibration per exercise (Learning → Calibrating → Stable → Stale)
- Auto progression after sessions based on RPE bands
- Completed workout sessions are immutable after completion. Corrections must create revised versions or adjustment records. This supports anti-cheat, debugging, and reproducible progression.

### 2. Command-center presentation

- Home reads like system status, not a fitness feed
- Copy is direct, sparse, system-driven
- One obvious next action per screen

### 3. Minimal idle economy

- **Power** — immediate effort from lifting
- **Credits** — idle conversion from Power (claim actions)
- **Entropy** — prestige / risk scaling
- One simple node chain or list in MVP
- One debuff type in MVP
- One prestige flow in MVP

### 4. Consequence without punishment porn

- Debuffs and prestige are serious but not melodramatic
- Safe terminology: Stability Task, Recovery Challenge, Overload Task, Bonus Set
- Avoid shame language and fantasy RPG framing

---

## MVP user journey (happy path)

1. **Welcome** — system online; initialize profile
2. **Training profile** — select focus (e.g. strength / general)
3. **Equipment setup** — folded into onboarding
4. **Command Center (Home)** — status, today's workout entry, resources
5. **Today's Workout** — start or review session plan
6. **Active Workout** — log sets with RPE; rest timer; complete set
7. **Post-workout** — progression applied; Power earned
8. **Nodes** — claim Credits from Power
9. **Calibration** — review exercise readiness states
10. **Debuff reveal** — when system assigns penalty (one type)
11. **Prestige** — attempt when window opens
12. **Profile / Stats** — basic history and meta

---

## Screen inventory (MVP)

| Screen | Purpose |
|--------|---------|
| Intro / Welcome | Orient; enter system |
| Training Profile Selection | Training focus |
| Equipment Setup | Available equipment (onboarding) |
| Home / Command Center | Hub; resources; primary commands |
| Today's Workout | Session entry |
| Active Workout Logger | Set logging |
| Calibration Status | Per-exercise readiness |
| Nodes / Idle Economy | Power → Credits |
| Debuff Reveal | Surface active debuff |
| Prestige Attempt | Risk / reset loop |
| Profile / Stats | User meta and summaries |

Route shells exist under `apps/mobile/app/`; behavior is implemented per story.

---

## RPE model (product)

UI shows simple labels; internal mapping is fixed:

| UI label | Internal RPE |
|----------|----------------|
| Easy | 6–7 |
| Medium | 7–8 |
| Hard | 8–9 |
| Near Death | 9.5–10 |

Progression after workout (high level):

- Easy / Medium → increase weight 2.5–5% or add 1–2 reps
- Hard → hold
- Near Death → reduce next session 2.5% or cap reps
- Plateau after 3 failed sessions; basic deload suggestion acceptable in MVP

All math lives in `packages/core-engine`, not UI.

---

## Calibration (product)

Internal states (exactly four):

| Internal | UI label |
|----------|----------|
| uncalibrated | Learning |
| provisional | Calibrating |
| calibrated | Stable |
| stale | Stale |

Do not add states without product review.

---

## Game economy (MVP)

| Currency | Role |
|----------|------|
| Power | Earned from workout output |
| Credits | Generated / claimed from Power |
| Entropy | Prestige and risk scaling |

MVP economy is intentionally small: one node chain (or list), one debuff, one prestige flow. No battle pass, store, or complex tech tree.

---

## Copy tone

**Do**

- System Stable
- Training Load Updated
- Calibration Improving
- Claim 420 Credits
- Set 3 Ready
- Entropy Rising
- Prestige Window Open

**Do not**

- Crush your goals!
- Beast mode
- Punishment set
- No pain no gain
- Emoji, mascots, confetti

---

## Explicit non-goals (MVP)

See `docs/dev/MVP_SCOPE.md` for engineering boundaries. Product excludes:

- Social, squads, friends
- Leaderboards and tournaments
- Watch app and wearables
- Advanced nutrition
- Deep cosmetics and monetization polish
- Subscriptions and store / battle pass
- Complex anti-cheat

Flag any of the above as **scope creep** if proposed during MVP.

---

## Success metrics (MVP — directional)

- User can complete onboarding and log a full workout without friction
- Calibration state visible and trustworthy for at least one exercise
- Power → Credits claim loop completable
- One debuff can trigger and clear
- One prestige attempt can succeed or fail with clear feedback

---

## Related documents

| Document | Path |
|----------|------|
| MVP scope (engineering) | `docs/dev/MVP_SCOPE.md` |
| Design system | `docs/design/DESIGN_SYSTEM.md` |
| Architecture | `docs/architecture/ARCHON_ARCHITECTURE.md` (pending Archon) |
| QA checklists | `docs/qa/` |

---

## Decision precedence

When requirements conflict:

1. Safety  
2. This product brief  
3. Architecture doc (when published)  
4. Design system  
5. Jira acceptance criteria  
6. Existing code  

If Jira conflicts with this brief or the design system, stop and escalate before implementing.

## Technical product assumptions

- Backend source of truth is Supabase.
- Mobile app is React Native + Expo.
- Shared workout and game math lives in `packages/core-engine`.
- Server-trusted progression, prestige, debuff, and completed-session rules should not rely only on client validation.
