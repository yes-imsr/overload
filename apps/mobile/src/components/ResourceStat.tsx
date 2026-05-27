import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/tokens";

export type ResourceKind = "power" | "credits" | "entropy" | "neutral";

type Props = {
  label: string;
  value: string;
  kind?: ResourceKind;
};

const valueColor: Record<ResourceKind, string> = {
  power: colors.accent.power,
  credits: colors.accent.credits,
  entropy: colors.text.secondary,
  neutral: colors.text.primary,
};

export function ResourceStat({ label, value, kind = "neutral" }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor[kind] }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxs,
  },
  label: {
    ...typography.label,
    color: colors.text.muted,
  },
  value: {
    ...typography.heading,
    color: colors.text.primary,
  },
});
