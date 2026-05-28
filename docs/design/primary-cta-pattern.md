# Primary CTA Pattern

OVR-13 defines one primary CTA pattern for MVP screens: every screen should make the next action obvious with a single `PrimaryCTAButton`.

## Usage

- Import `PrimaryCTAButton` from `@/components`.
- Use one primary CTA per screen or command module.
- Keep labels verb-first and specific: `Start Workout`, `Complete Set`, `Claim 420 Credits`.
- Use `loadingLabel` that preserves the action context, such as `Claiming Credits`.
- Do not use vague labels like `Next`, `Submit`, or `OK` when a specific command exists.

## Variants

- `standard`: off-white background with black text. Default for training actions such as `Start Workout`, `Complete Set`, and `Continue`.
- `economic`: credit yellow background with black text. Use only for Credits, node economy, and claim actions.
- `danger`: burgundy background with off-white text. Use only for risky confirmations or debuff/failure acknowledgement.
- `success`: calibration green background with black text. Use sparingly for calibration success or safe progression.

## Layout Rules

- Minimum height is 52px.
- Keep the primary CTA within thumb reach on action-heavy screens.
- Pair the CTA with a `CommandCard` when the screen needs status, consequence, and action in one module.
- Do not introduce extra color values in screens. Use the centralized tokens from `apps/mobile/src/tokens`.
