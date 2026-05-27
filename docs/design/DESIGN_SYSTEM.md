# Overload Design System

Overload is a mobile workout tracker fused with an idle progression game. It should feel like a serious training app that has been infected by a minimalist reactor/control-system game.

North star: **I lift, the system reacts, and my progress has consequences.**

This document defines the first real UI direction for Overload. It is the source of truth for early design prototyping and React Native + Expo implementation.

## Product Feel And Visual Identity

Overload should feel like **Apple Fitness + brutalist command center + idle reactor console**.

The app is not a wellness dashboard. It is an operating surface for training load, adaptation, and consequence. The user should feel like they are controlling a disciplined strength system that watches, learns, rewards, and pushes back.

Core traits:

- **Black-first:** `#040F16` dominates every screen.
- **Mechanical:** layouts use strict alignment, thin rules, compact labels, and instrument-like modules.
- **Disciplined:** copy is direct, sparse, and action-oriented.
- **Slightly dangerous:** risk states feel serious without becoming unsafe or hostile.
- **Premium minimal:** few colors, high contrast, sharp hierarchy, no game clutter.
- **System-driven:** progression is presented as cause and effect, not motivation fluff.

Primary metaphor: **training reactor**.

The user logs real physical output. The system converts it into Power, Credits, calibration confidence, node progression, risk, and prestige eligibility.

## Visual Ratio

Use color as system signal, not decoration.

- 70% Overload Black and deep graphite surfaces
- 20% Signal White, off-white text, graphite borders, and sparse light surfaces
- 5% Credit Yellow for Credits, claiming rewards, high-value actions, and active economy
- 3% Debuff Burgundy for danger, debuffs, Near Death RPE, failed prestige, and high-risk state
- 2% Calibration Green for calibrated state, success, and safe progression

Do not distribute colors evenly. Most screens should read as black/off-white at first glance, with color appearing only where the system state matters.

## Color Tokens

### Core Palette

```ts
export const colors = {
  overloadBlack: '#040F16',
  signalWhite: '#F4F3EE',
  creditYellow: '#FFD709',
  debuffBurgundy: '#721817',
  calibrationGreen: '#47A025',
};
```

### Semantic Tokens

```ts
export const semanticColors = {
  bg: '#040F16',
  bgElevated: '#071822',
  surface: '#091C26',
  surfaceRaised: '#0D2531',
  surfaceInverse: '#F4F3EE',

  textPrimary: '#F4F3EE',
  textSecondary: 'rgba(244, 243, 238, 0.68)',
  textTertiary: 'rgba(244, 243, 238, 0.42)',
  textInverse: '#040F16',

  borderSubtle: 'rgba(244, 243, 238, 0.10)',
  borderDefault: 'rgba(244, 243, 238, 0.18)',
  borderStrong: 'rgba(244, 243, 238, 0.34)',

  accentEconomic: '#FFD709',
  accentDanger: '#721817',
  accentSuccess: '#47A025',

  yellowTint: 'rgba(255, 215, 9, 0.12)',
  burgundyTint: 'rgba(114, 24, 23, 0.28)',
  greenTint: 'rgba(71, 160, 37, 0.16)',
};
```

### Color Usage Rules

- Use `overloadBlack` for app background, modal backdrop, bottom nav, and main cards.
- Use `surface` and `surfaceRaised` only to separate operating modules from the black canvas.
- Use `signalWhite` for primary text, critical dividers, outline buttons, and occasional inverse action surfaces.
- Use `creditYellow` only for Credits, claim actions, node income, economy deltas, and high-value CTAs.
- Use `debuffBurgundy` only for Debuff, high-risk, failure, Near Death RPE, and blocked states.
- Use `calibrationGreen` only for calibrated, safe progression, success confirmations, and confidence indicators.
- Never use yellow, burgundy, and green together at equal strength in one component.
- Do not use gradients as default surface styling. A single subtle reactor glow is allowed for prestige or claim moments only.

### Contrast Rules

- Yellow backgrounds must use black text (`#040F16`).
- Green backgrounds must use black text (`#040F16`) unless a tested contrast pass proves another pairing is accessible.
- Burgundy backgrounds must use off-white text (`#F4F3EE`).
- Never use white or off-white text on yellow.
- Never use white or off-white text on green for primary buttons.
- If yellow or green appears as text on a dark surface, keep the surrounding component mostly black/graphite so the signal remains controlled.

## Typography Rules

Overload typography should feel technical, fast, and premium. Use compact labels, strong headings, and large tabular numbers.

Recommended Expo font stack:

- Display: `Satoshi`, `Space Grotesk`, or `SF Pro Display`
- Body: `Inter`, `SF Pro Text`, or system sans
- Mono/numeric: `IBM Plex Mono`, `JetBrains Mono`, or platform monospace

If only system fonts are available, use `System` for body and enable tabular numerals for numeric rows where supported.

### Type Scale

```ts
export const type = {
  displayXL: { fontSize: 48, lineHeight: 52, fontWeight: '800', letterSpacing: -1.2 },
  display: { fontSize: 36, lineHeight: 40, fontWeight: '800', letterSpacing: -0.8 },
  h1: { fontSize: 28, lineHeight: 32, fontWeight: '800', letterSpacing: -0.4 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '750', letterSpacing: -0.2 },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '500' },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  numericXL: { fontSize: 44, lineHeight: 48, fontWeight: '800', letterSpacing: -0.8 },
  numeric: { fontSize: 28, lineHeight: 32, fontWeight: '800', letterSpacing: -0.4 },
  mono: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.4 },
};
```

### Typography Rules

- Use all-caps labels for system categories: `POWER`, `CREDITS`, `ENTROPY`, `CALIBRATION`.
- Use large tabular numbers for Power, Credits, Entropy, load, reps, RPE, rest timer, and prestige thresholds.
- Avoid friendly motivational headers like `Great job!` as primary copy.
- Prefer commands and state reports: `System Stable`, `Claim 420 Credits`, `Set 3 Ready`, `Calibration Updating`.
- Body copy should be short. If a paragraph exceeds two lines on a phone, reduce it.

## Spacing Scale

Use an 8-point base with smaller increments for dense controls.

```ts
export const space = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
};
```

Screen rhythm:

- Outer screen padding: `20px`
- Dense workout rows: `12px` vertical padding
- Standard cards: `16px` to `20px` padding
- Command cards: `20px` to `24px` padding
- Screen section gap: `20px` to `28px`
- Bottom nav safe area: `12px` top padding plus native safe-area inset

## Border Radius Rules

Overload is not bubbly. Corners should feel machined, not soft.

```ts
export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
};
```

Rules:

- Default cards: `14px`
- Compact rows and chips: `8px` to `10px`
- Primary CTA: `14px`
- Bottom nav active item: `999px`
- Prestige panel: `18px`, but with sharper inner divisions
- Do not use fully rounded bubbly cards.

## Card Styles

Cards are control modules. They should feel like readable instrument panels.

Base card:

- Background: `surface`
- Border: `1px solid borderSubtle`
- Radius: `14px`
- Padding: `16px` or `20px`
- Shadow: none by default
- Dividers: thin, low-opacity off-white

Raised card:

- Background: `surfaceRaised`
- Border: `1px solid borderDefault`
- Used for current workout, active claim, or selected state

Danger card:

- Background: `burgundyTint` over black
- Border: `1px solid rgba(114, 24, 23, 0.72)`
- Accent text: `signalWhite`, not red-on-black only

Economic card:

- Background: black or graphite with restrained yellow details
- Yellow is used for the value, active rule, or CTA only

Do not use left-border accent cards. If a module needs signal color, use a small top rail, status pill, numeric color, or command button.

## Button Styles

### Primary CTA Button

Use for the one action the screen wants the user to take.

Variants:

- `economic`: yellow background, black text. Use for `Claim Credits`, `Activate Node`, `Start Prestige` when reward/economy is primary.
- `standard`: off-white background, black text. Use for `Start Workout`, `Complete Set`, `Continue`.
- `danger`: burgundy background, off-white text. Use for confirming risky states, failed prestige review, or high-risk warning acknowledgement.
- `success`: green background, black text. Use sparingly after calibration or safe progression.

Rules:

- Minimum height: `52px`
- Primary action always appears above or within thumb reach.
- Label must be verb-first: `Start Workout`, `Complete Set`, `Claim 420 Credits`.
- Avoid vague labels like `Next`, `Submit`, or `OK` when a specific action exists.

### Secondary Button

- Transparent background
- Off-white border at `18%` opacity
- Off-white text
- Height: `44px` minimum
- Used for skip, edit, details, view history

### Tertiary Button

- Text only
- Muted text unless destructive or high-value
- Used for low-risk navigation, not primary flows

## Icon Rules

Icons should feel like control glyphs, not illustrations.

Use:

- Thin-line icons with squared geometry
- Simple symbols: bolt, node, timer, barbell, warning, lock, gauge
- 20px to 24px icons in nav and cards
- 16px icons in status pills

Avoid:

- Emoji
- Mascots
- Cartoon dumbbells
- Fantasy RPG icons
- Overly detailed sci-fi glyphs
- Icon beside every heading

Icons must explain state or navigation. Decoration-only icons should be removed.

## Motion And Animation Rules

Motion should feel like a system recalculating, not a playful celebration.

Default motion:

- Duration: `120ms` to `180ms` for taps and row changes
- Duration: `240ms` to `360ms` for panel reveals and claim moments
- Easing: quick-out, controlled-in; avoid bouncy easing

Allowed moments:

- Claim Credits: brief yellow pulse through the credit value and button edge
- Calibration update: green scan line or confidence bar filling
- Debuff reveal: burgundy panel locks in with a short mechanical snap
- Prestige attempt: slower ceremonial transition, dark pause, then threshold reveal
- Rest timer: steady numeric countdown, no distracting animation

Avoid:

- Confetti
- Mascot reactions
- Random gradients
- Floating particles except one restrained reactor pulse in prestige/claim moments
- Long transitions that slow workout logging

## Copywriting Rules

Tone: direct, compressed, consequence-aware.

The system should sound like a calm operator, not a hype coach.

Use:

- `System Stable`
- `Training Load Updated`
- `Calibration Improving`
- `Claim 420 Credits`
- `Set 3 Ready`
- `Entropy Rising`
- `Prestige Window Open`
- `Overload Task Assigned`

Avoid:

- `Crush your goals!`
- `You got this!`
- `Punishment set`
- `No pain no gain`
- `Beast mode`
- Unsafe pressure language

Debuff-safe wording:

- Overload Task
- Bonus Set
- Recovery Challenge
- Adaptation Set
- Stability Task

Copy pattern:

- State: `Entropy Rising`
- Meaning: `Missed volume increased instability.`
- Action: `Complete a Stability Task to reduce risk.`

## Screen Hierarchy Rules

Every screen follows this order:

1. **Status:** what state is the system/user in?
2. **Primary action:** what should the user do next?
3. **Secondary systems:** what reward/risk/details matter?
4. **Details:** history, metadata, explanations, edit controls

Rules:

- One primary CTA per screen.
- Top of Home must answer: `What is happening right now, and what should I do next?`
- Active Workout must prioritize current exercise, set number, weight, reps, RPE, rest timer, previous performance, and complete-set action.
- Never make all resources visually equal. Power and current action outrank historical stats.
- Dense data is acceptable only when the next action remains obvious.

## Component System

### Resource Stat

Purpose: show core resources like Power, Credits, Entropy, calibration confidence, and streak-free progress.

Anatomy:

- Label: all-caps mono label
- Value: large tabular number
- Delta: compact signed change when relevant
- Status rail or small signal dot

Variants:

- Power: off-white value, neutral rail
- Credits: yellow value, yellow delta for earnings
- Entropy: off-white value normally, burgundy when risky
- Calibration: green confidence value when stable

States:

- Default
- Updating
- Capped
- Risk
- Locked

Implementation notes:

- Use `Text` with tabular font variant when available.
- Animate value changes with short count transition only outside active set logging.
- Resource Stat should be a reusable component with semantic color prop, not arbitrary color input.

### Command Card

Purpose: the screen's main decision module.

Anatomy:

- System status label
- Primary headline
- Short consequence line
- Primary CTA
- Optional resource preview row

Examples:

- `System Stable` / `Today: Lower Body A` / `Estimated +18 Power` / `Start Workout`
- `Credits Ready` / `420 Credits Stored` / `Claim before entropy rises` / `Claim Credits`

States:

- Ready
- In progress
- Blocked
- Risk
- Claim available

Implementation notes:

- Use one Command Card near top of Home and key flow screens.
- Card should support sticky lower CTA on workout screens.

### Workout Card

Purpose: summarize a planned workout or completed session.

Anatomy:

- Workout name
- Estimated duration
- Exercise count
- Power gain estimate
- Risk or calibration note
- Start or review action

States:

- Planned
- Active
- Completed
- Adjusted by system
- Missed

Implementation notes:

- Use compact rows, not lifestyle imagery.
- If auto progression changed a workout, show the reason in one line: `Load adjusted from last completed RPE.`

### Exercise Set Row

Purpose: fast workout logging.

Anatomy:

- Set number
- Weight input
- Reps input
- RPE selector trigger or inline chips
- Previous performance
- Completion state

States:

- Upcoming
- Active
- Completed
- Failed / skipped
- Adjusted

Rules:

- Hit targets minimum `44px`.
- Avoid multi-step modal logging for normal sets.
- Weight and reps must be editable quickly.
- RPE must be selectable within one thumb movement.

Implementation notes:

- Use controlled `TextInput` for weight/reps with numeric keyboard.
- Preserve draft set data locally before network sync.
- Completed rows collapse into compact read-only summary after submission.

### Calibration Badge

Purpose: indicate how well the app understands the user.

Anatomy:

- UI label: `Learning`, `Calibrating`, `Stable`, or `Stale`
- Percentage or segment indicator
- Short reason

Product states:

- `uncalibrated` -> UI label `Learning`
- `provisional` -> UI label `Calibrating`
- `calibrated` -> UI label `Stable`
- `stale` -> UI label `Stale`

Visual tone:

- Green only when stable or improving.
- Neutral when `uncalibrated` / `Learning`.
- Green only for `calibrated` / `Stable` or a successful calibration update.
- Burgundy only for `stale` / `Stale` when the outdated model affects risk or recommendations.
- Never use childish level-up treatment.

Implementation notes:

- Treat calibration as a state machine with exactly these internal states: `uncalibrated`, `provisional`, `calibrated`, `stale`.
- Do not invent additional internal calibration states in UI copy, component props, or analytics names.

### Debuff Card

Purpose: explain a risk consequence and the action to resolve it.

Anatomy:

- Debuff name
- Severity label
- Cause line
- Effect line
- Recovery action
- Time/session requirement

Copy examples:

- `Entropy Spike`
- `Effect: Credits claim reduced by 12% until stabilized.`
- `Action: Complete one Stability Task.`

States:

- Revealed
- Active
- Stabilizing
- Cleared

Implementation notes:

- Do not use unsafe public copy like `punishment set`.
- Use `Overload Task`, `Recovery Challenge`, or `Stability Task`.

### Node Card

Purpose: show idle economy upgrades and production state.

Anatomy:

- Node name
- Production rate
- Unlock/upgrade cost
- Status: locked, charging, active, capped
- Claim or upgrade action

Visual tone:

- Small reactor/grid motif acceptable.
- Yellow should mark active economy, not every node border.

Implementation notes:

- Node list should support locked and unlocked states with clear affordance.
- Avoid complex tech trees in MVP; one linear node chain or small grid is enough.

### Prestige Panel

Purpose: high-stakes reset/attempt moment based on real workout performance.

Anatomy:

- Prestige window status
- Eligibility checklist
- Risk warning
- Reward preview
- Ceremonial CTA

States:

- Locked
- Eligible
- Attempt active
- Success
- Failed

Rules:

- Prestige must feel earned, not like a casual tap.
- Use burgundy for failed/high-risk state and yellow for high-value reward.
- Require a confirmation step with clear consequence copy.

Implementation notes:

- Use modal or full-screen route for confirmation.
- Persist attempt state locally to avoid accidental loss.

### Bottom Navigation

Tabs:

- Home
- Workout
- Nodes
- Progress
- Profile

Rules:

- Black background, subtle top border.
- Active tab uses off-white pill or thin yellow signal only if economy-relevant.
- Icons are simple line glyphs.
- Labels may be visible for clarity in MVP.

Implementation notes:

- Use Expo Router or React Navigation bottom tabs.
- Respect safe-area insets.
- Do not add social or shop tabs in MVP.

### Empty State

Purpose: explain what is missing and what to do next.

Anatomy:

- Short system label
- Direct explanation
- One CTA

Examples:

- `No Calibration Data` / `Complete two sessions so the system can estimate load.` / `Start First Workout`
- `No Nodes Active` / `Claim Credits to power your first node.` / `Claim Credits`

Visual tone:

- Quiet, not cute.
- No illustrations required. Use a small grid/terminal motif if needed.

### Loading State

Purpose: make calculation feel intentional.

Anatomy:

- Compact label
- Progress rail or pulse
- Optional subline

Examples:

- `Calculating Training Load`
- `Updating Calibration`
- `Syncing Set Data`

Rules:

- Use skeleton rows for workout lists.
- Use green scan for calibration updates.
- Do not block workout logging behind decorative loading unless necessary.

### Primary CTA Button

Purpose: drive the screen's primary action.

Required properties:

- `label`
- `variant`: `standard | economic | danger | success`
- `state`: `enabled | pressed | loading | disabled`
- Optional `valuePreview`, such as `+420`

Implementation notes:

- Minimum `52px` high.
- Use haptic feedback for complete set, claim, prestige confirm, and debuff reveal.
- Loading label should remain specific: `Claiming Credits`, not `Loading`.

### RPE Selector

Purpose: capture effort quickly during set logging.

Anatomy:

- Horizontal chips for `Easy`, `Medium`, `Hard`, and `Near Death`
- Labels first: `Easy`, `Medium`, `Hard`, `Near Death`
- Optional small numeric range displayed as secondary metadata only
- Selected state

Effort mapping:

- `Easy` -> internal RPE `6-7`
- `Medium` -> internal RPE `7-8`
- `Hard` -> internal RPE `8-9`
- `Near Death` -> internal RPE `9.5-10`

Rules:

- The UI should show the simple effort labels first; numeric RPE is an internal mapping, not the primary user-facing choice.
- `Near Death` may use burgundy signal.
- Avoid gamifying unsafe exertion.
- Keep selector reachable near weight/reps and complete action.

Implementation notes:

- Use `Pressable` chips with `44px` minimum height.
- Provide accessibility labels: `Hard effort, maps to RPE 8 to 9`.

## Accessibility Rules

- Maintain WCAG AA contrast for all text.
- Do not rely on color alone; pair color with label, icon, or shape.
- Minimum tap target: `44px` iOS, `48dp` Android where possible.
- Support Dynamic Type without breaking workout logging rows.
- Use clear labels for screen readers: `Credits, 420, claim available`.
- Avoid flashing or rapid pulsing animations.
- Respect reduced motion preferences.
- Numeric inputs must have labels, not placeholder-only fields.
- Danger states must describe consequence without shame or unsafe pressure.

## MVP Screen List

MVP includes:

- Intro / Welcome
- Training Profile Selection
- Equipment Setup
- Home / Command Center
- Today's Workout
- Active Workout Logger
- Calibration Status
- Nodes / Idle Economy
- Debuff Reveal
- Prestige Attempt
- Basic Profile / Stats

MVP excludes:

- Social
- Squads
- Leaderboards
- Tournaments
- Watch app
- Advanced nutrition
- Deep cosmetics
- Photo verification
- Complex anti-cheat
- Full monetization polish

Anything from the excluded list is scope creep until the core loop is working.

## Screen Concepts

### Intro / Welcome

Purpose: introduce the reactor training premise and set expectation that workout effort changes the system.

Primary action: `Initialize Training System`.

Visual hierarchy:

- Top: stark Overload wordmark or title
- Center: one-line north star
- Middle: three compact system promises: `Log Output`, `Earn Credits`, `Manage Consequences`
- Bottom: primary CTA and small sign-in/restore option

Components used:

- Command Card
- Primary CTA Button
- Loading State for initialization

Key copy:

- `Training creates signal.`
- `The system adapts to your output.`
- `Initialize Training System`

Empty/loading/error states:

- Loading: `Initializing Training System`
- Error: `System could not initialize. Check connection and retry.`

React Native + Expo notes:

- Use a full-screen `SafeAreaView` with black background.
- Store onboarding completion with local persistence.
- Keep animation to one subtle line scan or opacity transition.

### Training Profile Selection

Purpose: collect training experience, goal, available equipment, and schedule without feeling like a survey.

Primary action: `Build Training Profile`.

Visual hierarchy:

- Header: `Training Profile`
- Step indicator: `01 / 03`
- Main control stack: experience, goal, equipment, training days
- Bottom sticky CTA

Components used:

- Command Card
- Primary CTA Button
- Calibration Badge in `Learning` state
- Empty State for no equipment selected

Key copy:

- `The system needs your starting constraints.`
- `Select available equipment.`
- `Build Training Profile`

Empty/loading/error states:

- Empty: `No equipment selected. Choose at least one option to generate workouts.`
- Loading: `Building Initial Load Model`
- Error: `Profile incomplete. Add equipment and training frequency.`

React Native + Expo notes:

- Use selectable `Pressable` chips, not dropdown-heavy forms.
- Persist draft answers between steps.
- Equipment setup belongs here or immediately after; do not create a deep setup maze.

### Home / Command Center

Purpose: answer `What is happening right now, and what should I do next?`

Primary action: usually `Start Workout` or `Claim Credits`, depending on current state.

Visual hierarchy:

- Top status strip: `System Stable`, calibration confidence, entropy state
- Main Command Card: today's action
- Resource row: Power, Credits, Entropy
- Workout preview: today's workout and estimated Power gain
- Node status: idle economy summary
- Debuff/risk banner only when relevant
- Bottom navigation

Components used:

- Resource Stat
- Command Card
- Workout Card
- Calibration Badge
- Debuff Card
- Node Card summary
- Bottom Navigation
- Primary CTA Button

Key copy:

- `System Stable`
- `Today: Lower Body A`
- `Estimated +18 Power`
- `Claim 420 Credits`
- `Entropy low. Progression safe.`

Empty/loading/error states:

- Empty: `No workout generated. Complete Training Profile to start.`
- Loading: `Calculating Today's Load`
- Error: `Workout unavailable. Retry generation or use last known plan.`

React Native + Expo notes:

- Home should be a fast state dashboard, not a scroll-heavy feed.
- Use cached last-known resources while syncing.
- Primary CTA logic should be deterministic: claim available outranks low-priority details, active workout outranks claim.

## Home / Command Center Direction Options

These are composition directions for the first Home screen exploration. All three keep `#040F16` dominant, use color as system signal, and preserve the same product logic: the user should instantly understand current state, next action, reward, and risk.

### Direction A: Brutal Command Center

Layout description:

- A strict stacked command surface with heavy hierarchy and almost no ornament.
- Top 20%: status header with `SYSTEM STABLE`, calibration label, and current entropy state.
- Center: one large Command Card that owns the screen and states the next action.
- Below: three Resource Stat blocks in a hard grid: Power, Credits, Entropy.
- Lower section: Today's Workout as a compact mission card, followed by Debuff/Risk only if active.

Visual hierarchy:

- Biggest element is the command headline: `Lower Body A Ready` or `Credits Ready`.
- Second strongest element is the CTA button.
- Resource numbers are large, but subordinate to the current command.
- Risk never hides; if entropy is elevated, it moves above lower-detail economy summaries.

Component placement:

- Status strip at top edge.
- Command Card immediately below status.
- Resource Stat grid below Command Card.
- Workout Card below resources.
- Debuff Card between resources and workout when risk is active.
- Bottom Navigation fixed at the bottom.

Primary CTA behavior:

- `Start Workout` uses off-white background with black text.
- `Claim Credits` uses yellow background with black text.
- If an active workout exists, `Resume Workout` outranks claims.
- If a serious debuff blocks progression, CTA becomes `View Stability Task` or `Accept Stability Task`.

Power, Credits, Entropy:

- Power appears as the dominant neutral stat, off-white value on black.
- Credits appears yellow only in the number/delta, not as a full yellow card.
- Entropy appears neutral when low and burgundy only when rising or active.

Today's Workout:

- Compact mission module: workout name, duration, exercise count, estimated Power gain.
- Copy should feel assigned by the system: `Today: Lower Body A`, `Estimated +18 Power`.
- No lifestyle imagery or motivational banners.

Debuff/Risk:

- Hidden when inactive except for a small entropy stat.
- Active risk becomes a burgundy-tinted Debuff Card with cause, effect, and safe action.
- Avoid shame or unsafe wording; use `Stability Task`, `Recovery Challenge`, or `Overload Task`.

Avoid:

- Over-decorating the screen with reactor lines on every card.
- Treating Credits, Power, and Entropy as equal priority when a workout is ready.
- Large yellow cards unless the primary state is claim-ready.

### Direction B: Reactor Console

Layout description:

- The Home screen feels like a vertical reactor instrument panel.
- Top: circular or segmented Power core readout with a restrained radial/arc meter.
- Mid: resource rails for Credits and Entropy flanking or stacking under the core.
- Main lower card: Today's Workout as the action that feeds the reactor.
- Final lower module: node output and current risk state.

Visual hierarchy:

- Power core is the visual anchor, but the CTA remains the clearest action.
- Credits and Entropy appear as controlled signal rails, not separate dashboards.
- The workout card explains how today's effort changes the system.
- Calibration appears as a small state badge: `Learning`, `Calibrating`, `Stable`, or `Stale`.

Component placement:

- Header row: greeting/status plus Calibration Badge.
- Power Resource Stat embedded in the core module.
- Credits rail on one side/row, Entropy rail on the other.
- Command Card below the reactor readout with CTA.
- Node Card summary and Debuff Card follow lower in the stack.

Primary CTA behavior:

- CTA sits inside the Command Card, visually connected to the reactor readout.
- `Start Workout` is the default because lifting feeds Power.
- `Claim Credits` becomes primary only when idle output is capped or claim-ready.
- For risk, the CTA shifts to `Stabilize System` only if the debuff directly affects progression.

Power, Credits, Entropy:

- Power is shown as a central reactor/core output: large number, small delta, segment meter.
- Credits use yellow as a small active rail and numeric value.
- Entropy uses a segmented burgundy rail only when elevated; otherwise it stays muted.

Today's Workout:

- Framed as the next input into the reactor: `Input Required: Lower Body A`.
- Shows exercise count, estimated Power gain, and calibration impact.
- CTA copy can be `Start Workout` or `Feed System` only if tested as understandable; default remains `Start Workout`.

Debuff/Risk:

- Appears as a reactor instability module: `Entropy Rising`, cause, effect, stabilization action.
- Use a mechanical reveal/snapping motion when first shown.
- Burgundy is limited to the module edge, severity label, or full background only for route-level reveal.

Avoid:

- Neon cyberpunk effects, excessive glow, or fake 3D reactor art.
- Making the core meter decorative without actionable meaning.
- Hiding the workout CTA below too much instrumentation.

### Direction C: Premium Fitness/Game Hybrid

Layout description:

- The cleanest and most consumer-polished direction while preserving Overload's edge.
- Top: concise status and profile greeting.
- Primary hero: Today's Workout as a premium training card with system consequence preview.
- Secondary row: Power, Credits, Entropy in refined compact stats.
- Lower stack: Calibration status, Nodes summary, and Debuff/Risk if active.

Visual hierarchy:

- Today's Workout is the hero because the app is still a workout tracker first.
- Resource stats support the training loop rather than dominating the first view.
- CTA is large, clean, and thumb-reachable.
- Game systems feel premium and minimal, not like a cluttered idle game.

Component placement:

- Header: `System Stable` plus Calibration Badge.
- Workout Card promoted to hero position with the Primary CTA Button.
- Resource Stat row underneath.
- Node Card summary as a smaller economy panel.
- Debuff Card appears only when relevant, above Nodes if urgent.
- Bottom Navigation fixed at bottom.

Primary CTA behavior:

- `Start Workout` is primary most of the time.
- If a claim is ready but a workout is also ready, show claim as a secondary yellow mini-action unless Credits are capped.
- `Claim Credits` becomes primary when the main system state is economic and no workout is active.
- Risk-related CTAs never use yellow; danger confirmation uses burgundy with off-white text, recovery action can use standard off-white.

Power, Credits, Entropy:

- Power is shown as the clearest progress resource, large but not bigger than the workout title.
- Credits are a compact yellow value with claim availability.
- Entropy appears as a risk chip or small meter; burgundy only when elevated.

Today's Workout:

- Feels like a premium fitness command: workout name, duration, sets, progression reason, estimated Power gain.
- Copy example: `Lower Body A`, `Load adjusted from last Hard set`, `Estimated +18 Power`.
- Include enough detail to start confidently without turning Home into the full workout preview.

Debuff/Risk:

- When inactive, only Entropy state appears in the stat row.
- When active, show one serious risk card below the hero or above economy depending urgency.
- Copy stays safe: `Stability Task Available`, not `punishment` language.

Avoid:

- Looking like Apple Fitness with a dark skin and generic activity rings.
- Over-soft rounded cards, lifestyle photography, celebratory streak copy, or wellness tone.
- Turning game progression into badges/achievements before the core loop is clear.

### Today's Workout

Purpose: preview the planned session and explain why the system selected it.

Primary action: `Start Workout`.

Visual hierarchy:

- Header: workout name, duration, readiness/risk
- System adjustment note: `Load adjusted from last completed RPE`
- Exercise list grouped by order
- Estimated Power gain and calibration impact
- Sticky bottom CTA

Components used:

- Workout Card
- Exercise Set Row preview
- Calibration Badge
- Resource Stat for estimated Power
- Primary CTA Button

Key copy:

- `Lower Body A`
- `System adjusted squat load down 2.5kg after RPE 9.5.`
- `Start Workout`

Empty/loading/error states:

- Empty: `No workout scheduled. Generate from Training Profile.`
- Loading: `Preparing Set Targets`
- Error: `Unable to update load. Use previous targets?`

React Native + Expo notes:

- Exercise rows should be readable but not editable-heavy until active logging.
- Include an override/edit path, but keep it secondary.
- Do not include social sharing or leaderboards.

### Active Workout Logger

Purpose: log sets quickly with minimal taps.

Primary action: `Complete Set`.

Visual hierarchy:

- Sticky top: current exercise, set number, rest timer
- Main set panel: weight, reps, RPE
- Previous performance row
- Complete Set CTA
- Upcoming sets compressed below
- Bottom emergency actions: skip, edit, end workout

Components used:

- Exercise Set Row
- RPE Selector
- Primary CTA Button
- Resource Stat for live estimated Power gain
- Loading State for sync

Key copy:

- `Squat - Set 3 of 4`
- `Previous: 100kg x 5 @ 8.5`
- `Complete Set`
- `Rest 01:30`

Empty/loading/error states:

- Empty: `No active exercise. Start or resume workout.`
- Loading: `Saving Set`
- Error: `Set saved locally. Sync will retry.`

React Native + Expo notes:

- Numeric keyboard for weight and reps.
- RPE chips should be visible without a modal when space allows.
- Save set locally first, then sync.
- Use haptics on set completion.
- Rest timer must continue if the screen sleeps or app backgrounds.

### Calibration Status

Purpose: make calibration feel like `The app is learning me.`

Primary action: `Review Load Model` or `Continue Training`, depending context.

Visual hierarchy:

- Calibration confidence badge
- Strength estimate modules by lift
- Recent signals that changed the model
- What the app needs next
- CTA to continue or complete calibration workout

Components used:

- Calibration Badge
- Resource Stat
- Workout Card
- Empty State
- Loading State

Key copy:

- `Calibration Improving`
- `The system is learning your squat response.`
- `More clean sets needed for bench estimate.`

Empty/loading/error states:

- Empty: `No calibration data yet. Complete two sessions to establish a baseline.`
- Loading: `Updating Strength Estimate`
- Error: `Calibration stale. Log a workout to refresh.`

React Native + Expo notes:

- Show confidence per lift, not one vague global score only.
- Use green for stable estimates, neutral for learning, burgundy only if stale/risky.

### Nodes / Idle Economy

Purpose: convert real training output into idle progression without becoming a cluttered mobile game.

Primary action: `Claim Credits` or `Activate Node`.

Visual hierarchy:

- Credits Resource Stat at top
- Claim Command Card if credits are available
- Node list or small grid
- Production rate and caps
- Locked node previews

Components used:

- Resource Stat
- Node Card
- Command Card
- Primary CTA Button
- Empty State
- Loading State

Key copy:

- `Credits Ready`
- `Claim 420 Credits`
- `Node output capped until next workout.`
- `Activate Load Core`

Empty/loading/error states:

- Empty: `No active nodes. Claim Credits to power the first node.`
- Loading: `Calculating Node Output`
- Error: `Claim failed. Credits are safe; retry.`

React Native + Expo notes:

- Keep MVP economy simple: one claim loop, a small node list, clear caps.
- Do not add deep cosmetics, monetization polish, or complex tech trees yet.

### Debuff Reveal

Purpose: present a consequence seriously and give a safe recovery action.

Primary action: `Accept Stability Task` or `View Recovery Challenge`.

Visual hierarchy:

- Full-screen or dominant burgundy-tinted Debuff Card
- Debuff name and severity
- Cause and effect
- Safe recovery action
- CTA

Components used:

- Debuff Card
- Primary CTA Button danger or standard variant
- Resource Stat for Entropy

Key copy:

- `Entropy Spike Detected`
- `Effect: Credit claim reduced until stability improves.`
- `Action: Complete one Stability Task.`
- `Accept Stability Task`

Empty/loading/error states:

- Loading: `Resolving System State`
- Error: `Debuff state unavailable. Continue training; system will retry.`

React Native + Expo notes:

- Use a route-level reveal when first triggered, then compact card on Home.
- Avoid unsafe language and shame.
- Do not force a risky workout action as a penalty.

### Prestige Attempt

Purpose: make prestige feel high-stakes, earned, and ceremonial.

Primary action: `Begin Prestige Attempt` or `Confirm Prestige`.

Visual hierarchy:

- Prestige status: locked/eligible/active
- Eligibility checklist
- Reward preview
- Consequence warning
- Confirmation CTA
- Failure/success resolution state

Components used:

- Prestige Panel
- Resource Stat
- Primary CTA Button
- Calibration Badge
- Debuff Card for failed/risky state if needed

Key copy:

- `Prestige Window Open`
- `Attempt requires calibrated output and stable entropy.`
- `Rewards increase node capacity. Failure raises instability.`
- `Begin Prestige Attempt`

Empty/loading/error states:

- Empty/locked: `Prestige locked. Build Power and stabilize calibration.`
- Loading: `Evaluating Prestige Window`
- Error: `Prestige state unavailable. No changes applied.`

React Native + Expo notes:

- Use a full-screen confirmation route, not a small dialog.
- Require explicit confirmation with consequence copy.
- Persist attempt state and handle app close/resume safely.

## Component State Priorities

Priority order when multiple states compete:

1. Active workout / set logging
2. Safety or debuff risk
3. Claimable economy reward
4. Calibration status
5. Historical progress
6. Profile/settings details

This prevents Home and Workout screens from becoming equal-weight dashboards.

## Implementation Guidance For React Native + Expo

Recommended structure:

```txt
app/
  _layout.tsx
  index.tsx
  onboarding.tsx
  training-profile.tsx
  home.tsx
  workout/today.tsx
  workout/active.tsx
  calibration.tsx
  nodes.tsx
  debuff/[id].tsx
  prestige.tsx
components/
  ResourceStat.tsx
  CommandCard.tsx
  WorkoutCard.tsx
  ExerciseSetRow.tsx
  CalibrationBadge.tsx
  DebuffCard.tsx
  NodeCard.tsx
  PrestigePanel.tsx
  BottomNavigation.tsx
  PrimaryCTAButton.tsx
  RPESelector.tsx
tokens/
  colors.ts
  type.ts
  spacing.ts
  radius.ts
```

Implementation rules:

- Centralize tokens; do not hardcode colors per screen.
- Use semantic component variants rather than arbitrary color props.
- Use `expo-haptics` for set completion, claim, debuff reveal, and prestige confirmation.
- Use `react-native-safe-area-context` for all screens.
- Cache active workout and draft set logs locally.
- Use optimistic local save for workout logging.
- Keep screens implementation-ready with real inputs, state transitions, validation, and error handling.

## Things To Avoid

- Generic fitness app cards
- Beige, peach, cream, or wellness dashboards
- Soft habit tracker tone
- Fantasy RPG UI
- Mascots
- Emoji feature icons
- Generic gym bro graphics
- Confetti celebration
- Colorful idle-game clutter
- Random gradients
- Glassmorphism overload
- Social, squads, leaderboards, tournaments in MVP
- Complex anti-cheat or photo verification in MVP
- Unsafe debuff language like `punishment set`
- Screen layouts where every metric fights for attention
- Decorative components that do not explain state or action

## First-Pass Prototype Direction

For 6-8 mobile screens, prioritize these first:

1. Intro / Welcome
2. Training Profile Selection with equipment setup folded in
3. Home / Command Center
4. Today's Workout
5. Active Workout Logger
6. Calibration Status
7. Nodes / Idle Economy
8. Debuff Reveal or Prestige Attempt

If only 6 screens are built, combine Debuff as a Home overlay state and defer Prestige Attempt to the next pass. If 8 screens are built, include both Debuff Reveal and Prestige Attempt.

## MVP Scope Creep Flags

Flag as scope creep unless explicitly approved:

- Social feed, friends, squads, comments, or sharing
- Leaderboards, tournaments, seasons, public rankings
- Watch app or wearable companion
- Nutrition, meal tracking, macros, recovery lifestyle tracking
- Deep cosmetics, skins, avatars, loot crates
- Complex anti-cheat, photo/video verification
- Monetization polish, store, subscriptions, battle pass
- Large branching node tree before one simple economy loop works
- Multiple debuff types before one safe debuff loop works
- Multiple prestige modes before one ceremonial prestige attempt works

## Acceptance Checklist

- Home answers what is happening and what to do next.
- Active Workout prioritizes exercise, set, weight, reps, RPE, rest, previous performance, and complete set.
- Calibration feels like the app is learning the user.
- Debuff language is serious but safe.
- Prestige feels high-stakes and ceremonial.
- `#040F16` dominates the system.
- Yellow, burgundy, and green are system signals, not equal decoration.
- Components are reusable and implementation-ready for React Native + Expo.
- MVP scope is clear and protected.
