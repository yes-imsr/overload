# Overload

Mobile workout tracker fused with an idle progression game. Monorepo foundation for React Native (Expo), shared core logic, and Supabase.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- Expo Go or a local Android/iOS simulator for mobile dev

## Install

```bash
pnpm install
```

## Run mobile app

```bash
pnpm mobile
```

Platform shortcuts:

```bash
pnpm mobile:android
pnpm mobile:ios
pnpm mobile:web
```

Copy `apps/mobile/.env.example` to `apps/mobile/.env` when Supabase is configured.

## Test core-engine

```bash
pnpm test
```

Watch mode:

```bash
pnpm test:watch
```

## Typecheck

```bash
pnpm typecheck
```

## Workspace layout

```
apps/mobile/          Expo Router app
packages/core-engine/ Pure TypeScript workout/game logic
supabase/             Migrations and Edge Functions (placeholders)
docs/                 Product, design, architecture, dev, QA
```

## MVP route shells

| Route | Screen |
|-------|--------|
| `/` | Intro / Welcome |
| `/training-profile` | Training Profile |
| `/home` | Command Center |
| `/todays-workout` | Today's Workout |
| `/active-workout` | Active Workout |
| `/calibration` | Calibration Status |
| `/nodes` | Nodes / idle economy |
| `/debuff` | Debuff Reveal |
| `/prestige` | Prestige |
| `/profile` | Profile / Stats |

## What is not in this foundation

- Supabase schema and RLS
- Real workout logging, calibration math, or game economy
- Social, squads, leaderboards, watch app, nutrition, monetization
