import {
  getCalibrationUiLabel,
  type CalibrationState,
} from "@overload/core-engine";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

export type CalibrationUiState = CalibrationState;

type Props = {
  state: CalibrationUiState;
};

const config: Record<
  CalibrationUiState,
  { background: string; text: string }
> = {
  uncalibrated: {
    background: colors.background.surface,
    text: colors.text.secondary,
  },
  provisional: {
    background: colors.background.surface,
    text: colors.accent.power,
  },
  calibrated: {
    background: colors.accent.successMuted,
    text: colors.text.primary,
  },
  stale: {
    background: colors.accent.danger,
    text: colors.text.primary,
  },
};

export function CalibrationBadge({ state }: Props) {
  const { background, text } = config[state];
  const label = getCalibrationUiLabel(state);

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
