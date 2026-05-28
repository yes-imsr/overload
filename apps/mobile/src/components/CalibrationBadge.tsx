import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

/** Internal calibration states map to these UI labels in product rules. */
export type CalibrationUiState =
  | "learning"
  | "calibrating"
  | "stable"
  | "stale";

type Props = {
  state: CalibrationUiState;
};

const config: Record<
  CalibrationUiState,
  { label: string; background: string; text: string }
> = {
  learning: {
    label: "Learning",
    background: colors.background.surface,
    text: colors.text.secondary,
  },
  calibrating: {
    label: "Calibrating",
    background: colors.background.surface,
    text: colors.accent.power,
  },
  stable: {
    label: "Stable",
    background: colors.accent.successMuted,
    text: colors.text.primary,
  },
  stale: {
    label: "Stale",
    background: colors.accent.danger,
    text: colors.text.primary,
  },
};

export function CalibrationBadge({ state }: Props) {
  const { label, background, text } = config[state];

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  label: {
    ...typography.label,
    fontSize: 10,
  },
});
