/**
 * Overload color tokens. Do not hardcode hex values in screens — import from here.
 * Yellow: Credits / economy / high-value claim only.
 * Burgundy: danger / debuff / failure / high-risk only.
 * Green: calibrated / success / safe progression only.
 */
export const colors = {
  background: {
    primary: "#040F16",
    elevated: "#0A1A24",
    surface: "#0F2430",
    border: "#1A3545",
  },
  text: {
    primary: "#E8F0F4",
    secondary: "#8FA4B0",
    muted: "#5C7280",
    inverse: "#040F16",
  },
  accent: {
    /** Credits, economy, claim actions */
    credits: "#F5C518",
    creditsMuted: "#C49E12",
    /** Calibrated, success, safe progression */
    success: "#2ECC71",
    successMuted: "#1F9D55",
    /** Debuff, danger, failure, high-risk */
    danger: "#8B2942",
    dangerBright: "#B3364F",
    /** Power / system emphasis (non-economy) */
    power: "#4DA3FF",
    neutral: "#6B8494",
  },
  state: {
    disabled: "#2A3D4A",
    focus: "#4DA3FF",
  },
} as const;

/** MVP semantic palette names (OVR-13). Prefer `colors.*` in components. */
export const palette = {
  black: colors.background.primary,
  offWhite: colors.text.primary,
  creditYellow: colors.accent.credits,
  burgundy: colors.accent.danger,
  calibrationGreen: colors.accent.success,
} as const;

export type Colors = typeof colors;
