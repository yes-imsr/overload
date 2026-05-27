# Primary CTA pattern (Overload mobile)

Source of truth for visuals: `docs/design/DESIGN_SYSTEM.md`.

## Rule

Every screen exposes **one** obvious next action via `PrimaryCTAButton`.

## Component

```tsx
import { PrimaryCTAButton } from "@/components";

<PrimaryCTAButton
  label="Complete Set"
  variant="default"
  onPress={handleComplete}
/>
```

## Variants

| `variant` | Use |
|-----------|-----|
| `default` | Standard command actions (complete set, continue, save) |
| `credits` | Economy / claim / high-value credit actions only |
| `danger` | Prestige attempt, debuff recovery, blocked or high-risk confirms |
| `success` | Safe progression confirms (calibration complete, task cleared) |

## States

- `disabled` — action unavailable; pair with system copy explaining why.
- `loading` — use a specific label in the parent if needed (`Claiming Credits`); button shows spinner when `loading` is true.

## Layout

- Minimum height **52px** (enforced in component).
- Place at the bottom of the screen content or directly under the active task panel (workout logger, claim panel).
- Do not stack multiple primary CTAs; secondary actions belong in `CommandCard` or text links.

## Tokens

Never hardcode colors on screens. Import `colors`, `spacing`, and `typography` from `@/tokens`.
