import {
  type CalibrationStatus,
  type CalibrationUiState,
  toCalibrationUiLabel,
  toCalibrationUiState,
} from "@overload/core-engine";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

export type { CalibrationUiState };

type Props =
  | { state: CalibrationUiState }
  | { status: CalibrationStatus };

function resolveUiState(props: Props): CalibrationUiState {
  if ("status" in props) {
    return toCalibrationUiState(props.status);
  }
  return props.state;
}

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

export function CalibrationBadge(props: Props) {
  const state = resolveUiState(props);
  const label =
    "status" in props ? toCalibrationUiLabel(props.status) : config[state].label;
  const { background, text } = config[state];

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
