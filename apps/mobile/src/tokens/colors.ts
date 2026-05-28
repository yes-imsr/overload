/**
 * Overload color tokens. Do not hardcode color values in screens - import from here.
 * Yellow: Credits / economy / high-value claim only.
 * Burgundy: danger / debuff / failure / high-risk only.
 * Green: calibrated / success / safe progression only.
 */
export const coreColors = {
  overloadBlack: "#040F16",
  offWhite: "#F4F3EE",
  creditYellow: "#FFD709",
  debuffBurgundy: "#721817",
  calibrationGreen: "#47A025",
} as const;

export const colors = {
  core: coreColors,
  background: {
    primary: coreColors.overloadBlack,
    elevated: "#071822",
    surface: "#091C26",
    surfaceRaised: "#0D2531",
    inverse: coreColors.offWhite,
    border: "rgba(244, 243, 238, 0.18)",
    borderSubtle: "rgba(244, 243, 238, 0.10)",
    borderStrong: "rgba(244, 243, 238, 0.34)",
  },
  text: {
    primary: coreColors.offWhite,
    secondary: "rgba(244, 243, 238, 0.68)",
    muted: "rgba(244, 243, 238, 0.42)",
    inverse: coreColors.overloadBlack,
  },
  accent: {
    /** Credits, economy, claim actions */
    credits: coreColors.creditYellow,
    creditsMuted: "rgba(255, 215, 9, 0.68)",
    creditsTint: "rgba(255, 215, 9, 0.12)",
    /** Calibrated, success, safe progression */
    success: coreColors.calibrationGreen,
    successMuted: "rgba(71, 160, 37, 0.72)",
    successTint: "rgba(71, 160, 37, 0.16)",
    /** Debuff, danger, failure, high-risk */
    danger: coreColors.debuffBurgundy,
    dangerBright: "#9C2625",
    dangerTint: "rgba(114, 24, 23, 0.28)",
    /** Power / system emphasis stays off-white, not a separate random accent. */
    power: coreColors.offWhite,
    neutral: "rgba(244, 243, 238, 0.34)",
  },
  state: {
    disabled: "rgba(244, 243, 238, 0.16)",
    focus: coreColors.offWhite,
    pressed: "rgba(244, 243, 238, 0.08)",
  },
} as const;

export type CoreColors = typeof coreColors;
export type Colors = typeof colors;
