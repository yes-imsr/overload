import { TextStyle } from "react-native";

export const fontFamily = {
  regular: "System",
  medium: "System",
  semibold: "System",
  mono: "Courier",
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 32,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const typography = {
  display: {
    fontSize: fontSize.display,
    fontWeight: "700",
    letterSpacing: -0.5,
  } satisfies TextStyle,
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "600",
    letterSpacing: -0.25,
  } satisfies TextStyle,
  heading: {
    fontSize: fontSize.xl,
    fontWeight: "600",
  } satisfies TextStyle,
  body: {
    fontSize: fontSize.md,
    fontWeight: "400",
  } satisfies TextStyle,
  bodyMedium: {
    fontSize: fontSize.md,
    fontWeight: "500",
  } satisfies TextStyle,
  caption: {
    fontSize: fontSize.sm,
    fontWeight: "400",
  } satisfies TextStyle,
  label: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  } satisfies TextStyle,
  mono: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.mono,
    fontWeight: "400",
  } satisfies TextStyle,
} as const;
