import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

export type EffortLevel = "easy" | "medium" | "hard" | "near_death";

type Props = {
  value?: EffortLevel;
  onChange: (level: EffortLevel) => void;
  disabled?: boolean;
};

const OPTIONS: {
  id: EffortLevel;
  label: string;
  accessibilityLabel: string;
  rangeHint: string;
}[] = [
  {
    id: "easy",
    label: "Easy",
    accessibilityLabel: "Easy effort, maps to RPE 6 to 7",
    rangeHint: "6-7",
  },
  {
    id: "medium",
    label: "Medium",
    accessibilityLabel: "Medium effort, maps to RPE 7 to 8",
    rangeHint: "7-8",
  },
  {
    id: "hard",
    label: "Hard",
    accessibilityLabel: "Hard effort, maps to RPE 8 to 9",
    rangeHint: "8-9",
  },
  {
    id: "near_death",
    label: "Near Death",
    accessibilityLabel: "Near Death effort, maps to RPE 9.5 to 10",
    rangeHint: "9.5-10",
  },
];

export function RPESelector({ value, onChange, disabled = false }: Props) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {OPTIONS.map((option) => {
        const selected = value === option.id;
        const isNearDeath = option.id === "near_death";

        return (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={option.accessibilityLabel}
            disabled={disabled}
            onPress={() => onChange(option.id)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              isNearDeath && selected && styles.chipNearDeath,
              pressed && !disabled && styles.chipPressed,
              disabled && styles.chipDisabled,
            ]}
          >
            <Text
              style={[
                styles.label,
                selected && styles.labelSelected,
                isNearDeath && selected && styles.labelNearDeath,
              ]}
            >
              {option.label}
            </Text>
            <Text style={styles.range}>{option.rangeHint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    minHeight: 44,
    minWidth: 72,
    flexGrow: 1,
    flexBasis: "22%",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.background.border,
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  chipSelected: {
    borderColor: colors.text.secondary,
    backgroundColor: colors.background.surface,
  },
  chipNearDeath: {
    borderColor: colors.accent.dangerBright,
    backgroundColor: colors.accent.danger,
  },
  chipPressed: {
    opacity: 0.9,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    textAlign: "center",
  },
  labelSelected: {
    color: colors.text.primary,
  },
  labelNearDeath: {
    color: colors.text.primary,
  },
  range: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.muted,
  },
});
