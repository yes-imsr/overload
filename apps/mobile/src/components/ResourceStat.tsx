import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/tokens";

export type ResourceKind = "power" | "credits" | "entropy" | "neutral";

type Props = {
  label: string;
  value: string;
  kind?: ResourceKind;
  elevated?: boolean;
};

const valueColor = (kind: ResourceKind, elevated: boolean): string => {
  if (kind === "entropy" && elevated) {
    return colors.accent.dangerBright;
  }

  return {
    power: colors.accent.power,
    credits: colors.accent.credits,
    entropy: colors.text.secondary,
    neutral: colors.text.primary,
  }[kind];
};

export function ResourceStat({ label, value, kind = "neutral", elevated = false }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor(kind, elevated) }]}>{value}</Text>
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
