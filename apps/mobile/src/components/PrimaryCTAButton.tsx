import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

export type PrimaryCTAButtonVariant = "standard" | "economic" | "danger" | "success";

export type PrimaryCTAButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: PrimaryCTAButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
  valuePreview?: string;
  style?: StyleProp<ViewStyle>;
};

const labelColorByVariant = {
  standard: colors.text.inverse,
  economic: colors.text.inverse,
  danger: colors.text.primary,
  success: colors.text.inverse,
} as const satisfies Record<PrimaryCTAButtonVariant, string>;

export function PrimaryCTAButton({
  label,
  variant = "standard",
  loading = false,
  loadingLabel,
  valuePreview,
  disabled,
  style,
  ...pressableProps
}: PrimaryCTAButtonProps) {
  const isUnavailable = disabled || loading;
  const displayLabel = loading ? loadingLabel ?? label : label;
  const labelColor = labelColorByVariant[variant];

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isUnavailable }}
      disabled={isUnavailable}
      style={({ pressed }) => [
        styles.button,
        buttonVariantStyles[variant],
        pressed && !isUnavailable ? styles.pressed : null,
        isUnavailable ? styles.disabled : null,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={labelColor} size="small" /> : null}
        <Text style={[styles.label, { color: labelColor }]}>{displayLabel}</Text>
      </View>
      {valuePreview ? (
        <Text style={[styles.valuePreview, { color: labelColor }]}>{valuePreview}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  label: {
    ...typography.bodyMedium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  valuePreview: {
    ...typography.mono,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.48,
  },
});

const buttonVariantStyles = StyleSheet.create({
  standard: {
    backgroundColor: colors.text.primary,
  },
  economic: {
    backgroundColor: colors.accent.credits,
  },
  danger: {
    backgroundColor: colors.accent.danger,
  },
  success: {
    backgroundColor: colors.accent.success,
  },
});
