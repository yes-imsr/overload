# Design primitives (OVR-13)

MVP shared UI for `apps/mobile`. Feature screens compose these — do not duplicate patterns inline.

## Tokens (`src/tokens`)

| Export | Purpose |
|--------|---------|
| `colors` | Backgrounds, text, semantic accents |
| `palette` | Named MVP colors: black, off-white, credit yellow, burgundy, calibration green |
| `spacing` | 4px grid |
| `typography` | Type scale |
| `radius` | Corner radii |

Import from `@/tokens` only. Hex values live in `colors.ts` — not in screens.

## Components (`src/components`)

| Component | Purpose |
|-----------|---------|
| `CommandCard` | Actionable command / navigation tile |
| `ResourceStat` | Power, Credits, Entropy display |
| `PrimaryCTAButton` | Single primary action per screen — see [PRIMARY_CTA.md](./PRIMARY_CTA.md) |
| `CalibrationBadge` | Learning / Calibrating / Stable / Stale |
| `RPESelector` | Effort chips: Easy, Medium, Hard, Near Death |

## Color semantics

- **Black / off-white** — default surfaces and primary text (`colors.background.primary`, `colors.text.primary`)
- **Credit yellow** — Credits, economy, claim CTAs (`colors.accent.credits`, `PrimaryCTAButton` `credits` variant)
- **Burgundy** — danger, debuff, Near Death effort (`colors.accent.danger*`, `RPESelector` near-death chip)
- **Calibration green** — stable / success (`colors.accent.success*`, `CalibrationBadge` stable, CTA `success` variant)
