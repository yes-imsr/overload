import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

export type CalibrationState = "uncalibrated" | "provisional" | "calibrated" | "stale";

export type CalibrationBadgeProps = {
  state: CalibrationState;
  confidenceLabel?: string;
  reason?: string;
};

type CalibrationTone = "neutral" | "success" | "danger";

const calibrationStateConfig = {
  uncalibrated: { label: "Learning", tone: "neutral" },
  provisional: { label: "Calibrating", tone: "neutral" },
  calibrated: { label: "Stable", tone: "success" },
  stale: { label: "Stale", tone: "danger" },
} as const satisfies Record<CalibrationState, { label: string; tone: CalibrationTone }>;

export function CalibrationBadge({ state, confidenceLabel, reason }: CalibrationBadgeProps) {
  const config = calibrationStateConfig[state];

  return (
    <View style={[styles.badge, badgeToneStyles[config.tone]]}>
      <View style={styles.topRow}>
        <View style={[styles.dot, dotToneStyles[config.tone]]} />
        <Text style={[styles.label, labelToneStyles[config.tone]]}>{config.label}</Text>
        {confidenceLabel ? <Text style={styles.confidence}>{confidenceLabel}</Text> : null}
      </View>
      {reason ? <Text style={styles.reason}>{reason}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    gap: spacing.xs,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
  },
  label: {
    ...typography.label,
  },
  confidence: {
    ...typography.mono,
    color: colors.text.secondary,
  },
  reason: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

const badgeToneStyles = StyleSheet.create({
  neutral: {
    borderColor: colors.background.border,
    backgroundColor: colors.background.elevated,
  },
  success: {
    borderColor: colors.accent.successMuted,
    backgroundColor: colors.accent.successTint,
  },
  danger: {
    borderColor: colors.accent.dangerBright,
    backgroundColor: colors.accent.dangerTint,
  },
});

const dotToneStyles = StyleSheet.create({
  neutral: {
    backgroundColor: colors.text.muted,
  },
  success: {
    backgroundColor: colors.accent.success,
  },
  danger: {
    backgroundColor: colors.accent.danger,
  },
});

const labelToneStyles = StyleSheet.create({
  neutral: {
    color: colors.text.primary,
  },
  success: {
    color: colors.accent.success,
  },
  danger: {
    color: colors.text.primary,
  },
});
