import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

type Props = {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
};

export function OptionChip({ label, description, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <View style={styles.copy}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.background.surface,
  },
  chipSelected: {
    borderColor: colors.accent.success,
  },
  chipPressed: {
    opacity: 0.9,
  },
  copy: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  labelSelected: {
    color: colors.text.primary,
  },
  description: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
