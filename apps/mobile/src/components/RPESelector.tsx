import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

export const rpeOptions = [
  {
    value: "easy",
    label: "Easy",
    rangeLabel: "6-7",
    accessibilityLabel: "Easy effort, maps to RPE 6 to 7",
    tone: "standard",
  },
  {
    value: "medium",
    label: "Medium",
    rangeLabel: "7-8",
    accessibilityLabel: "Medium effort, maps to RPE 7 to 8",
    tone: "standard",
  },
  {
    value: "hard",
    label: "Hard",
    rangeLabel: "8-9",
    accessibilityLabel: "Hard effort, maps to RPE 8 to 9",
    tone: "standard",
  },
  {
    value: "nearDeath",
    label: "Near Death",
    rangeLabel: "9.5-10",
    accessibilityLabel: "Near Death effort, maps to RPE 9.5 to 10",
    tone: "danger",
  },
] as const;

export type RPEOptionValue = (typeof rpeOptions)[number]["value"];

export type RPESelectorProps = {
  value?: RPEOptionValue;
  onChange: (value: RPEOptionValue) => void;
  disabled?: boolean;
  showRanges?: boolean;
};

export function RPESelector({
  value,
  onChange,
  disabled = false,
  showRanges = true,
}: RPESelectorProps) {
  return (
    <View accessibilityLabel="Effort selector" style={styles.container}>
      {rpeOptions.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityLabel={option.accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled, selected }}
            disabled={disabled}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.chip,
              option.tone === "danger" ? styles.dangerChip : styles.standardChip,
              selected ? selectedChipStyles[option.tone] : null,
              pressed && !disabled ? styles.pressed : null,
              disabled ? styles.disabled : null,
            ]}
          >
            <Text
              style={[
                styles.label,
                selected ? selectedLabelStyles[option.tone] : styles.unselectedLabel,
              ]}
            >
              {option.label}
            </Text>
            {showRanges ? (
              <Text
                style={[
                  styles.range,
                  selected ? selectedRangeStyles[option.tone] : styles.unselectedRange,
                ]}
              >
                {option.rangeLabel}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  standardChip: {
    borderColor: colors.background.border,
    backgroundColor: colors.background.elevated,
  },
  dangerChip: {
    borderColor: colors.accent.dangerBright,
    backgroundColor: colors.background.elevated,
  },
  label: {
    ...typography.bodyMedium,
  },
  range: {
    ...typography.mono,
  },
  unselectedLabel: {
    color: colors.text.primary,
  },
  unselectedRange: {
    color: colors.text.muted,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.48,
  },
});

const selectedChipStyles = StyleSheet.create({
  standard: {
    borderColor: colors.text.primary,
    backgroundColor: colors.text.primary,
  },
  danger: {
    borderColor: colors.accent.dangerBright,
    backgroundColor: colors.accent.danger,
  },
});

const selectedLabelStyles = StyleSheet.create({
  standard: {
    color: colors.text.inverse,
  },
  danger: {
    color: colors.text.primary,
  },
});

const selectedRangeStyles = StyleSheet.create({
  standard: {
    color: colors.text.inverse,
  },
  danger: {
    color: colors.text.primary,
  },
});
