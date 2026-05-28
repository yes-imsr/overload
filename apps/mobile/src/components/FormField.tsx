import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function FormField({ label, error, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.text.muted}
        style={[styles.input, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: radius.md,
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
});
