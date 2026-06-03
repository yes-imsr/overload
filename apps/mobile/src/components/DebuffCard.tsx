import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";
import type { StabilityDebuffSnapshot } from "@/features/stability/types";

type Props = {
  debuff: StabilityDebuffSnapshot;
};

export function DebuffCard({ debuff }: Props) {
  const statusLabel =
    debuff.status === "pending_reveal"
      ? "Entropy Rising"
      : debuff.status === "active"
        ? "Stability Task Active"
        : debuff.label;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{statusLabel}</Text>
      <Text style={styles.title}>{debuff.label}</Text>
      <Text style={styles.body}>{debuff.cause}</Text>
      <Text style={styles.body}>{debuff.effect}</Text>
      <Text style={styles.action}>{debuff.action}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent.danger,
    padding: spacing.md,
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.label,
    color: colors.accent.dangerBright,
    textTransform: "uppercase",
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  body: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  action: {
    ...typography.caption,
    color: colors.accent.dangerBright,
    marginTop: spacing.xxs,
  },
});
