import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

export type ResourceStatVariant = "power" | "credits" | "entropy" | "calibration" | "neutral";
export type ResourceStatStatus = "default" | "updating" | "capped" | "risk" | "locked";

export type ResourceStatProps = {
  label: string;
  value: string | number;
  variant?: ResourceStatVariant;
  delta?: string;
  status?: ResourceStatStatus;
  statusLabel?: string;
};

type ResourceStatTone = ResourceStatVariant | "risk";

export function ResourceStat({
  label,
  value,
  variant = "neutral",
  delta,
  status = "default",
  statusLabel,
}: ResourceStatProps) {
  const tone: ResourceStatTone = status === "risk" ? "risk" : variant;

  return (
    <View style={styles.card}>
      <View style={[styles.rail, railToneStyles[tone]]} />
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        {statusLabel ? <Text style={styles.status}>{statusLabel}</Text> : null}
      </View>
      <Text style={[styles.value, valueToneStyles[tone]]}>{value}</Text>
      {delta ? <Text style={[styles.delta, deltaToneStyles[tone]]}>{delta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    minWidth: 112,
    borderWidth: 1,
    borderColor: colors.background.borderSubtle,
    borderRadius: radius.md,
    backgroundColor: colors.background.elevated,
    padding: spacing.md,
  },
  rail: {
    width: 28,
    height: 3,
    borderRadius: radius.full,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text.muted,
  },
  status: {
    ...typography.mono,
    color: colors.text.secondary,
    textTransform: "uppercase",
  },
  value: {
    ...typography.display,
    fontVariant: ["tabular-nums"],
  },
  delta: {
    ...typography.mono,
    fontVariant: ["tabular-nums"],
  },
});

const valueToneStyles = StyleSheet.create({
  power: {
    color: colors.accent.power,
  },
  credits: {
    color: colors.accent.credits,
  },
  entropy: {
    color: colors.text.primary,
  },
  calibration: {
    color: colors.accent.success,
  },
  neutral: {
    color: colors.text.primary,
  },
  risk: {
    color: colors.text.primary,
  },
});

const deltaToneStyles = StyleSheet.create({
  power: {
    color: colors.text.secondary,
  },
  credits: {
    color: colors.accent.credits,
  },
  entropy: {
    color: colors.text.secondary,
  },
  calibration: {
    color: colors.accent.success,
  },
  neutral: {
    color: colors.text.secondary,
  },
  risk: {
    color: colors.text.primary,
  },
});

const railToneStyles = StyleSheet.create({
  power: {
    backgroundColor: colors.background.borderStrong,
  },
  credits: {
    backgroundColor: colors.accent.credits,
  },
  entropy: {
    backgroundColor: colors.background.borderStrong,
  },
  calibration: {
    backgroundColor: colors.accent.success,
  },
  neutral: {
    backgroundColor: colors.background.borderStrong,
  },
  risk: {
    backgroundColor: colors.accent.danger,
  },
});
