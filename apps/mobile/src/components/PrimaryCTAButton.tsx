import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

export type PrimaryCTAVariant = "default" | "credits" | "danger" | "success";

type Props = Omit<PressableProps, "style"> & {
  label: string;
  variant?: PrimaryCTAVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variantStyles: Record<
  PrimaryCTAVariant,
  { background: string; text: string }
> = {
  default: {
    background: colors.background.surface,
    text: colors.text.primary,
  },
  credits: {
    background: colors.accent.credits,
    text: colors.text.inverse,
  },
  danger: {
    background: colors.accent.dangerBright,
    text: colors.text.primary,
  },
  success: {
    background: colors.accent.success,
    text: colors.text.inverse,
  },
};

export function PrimaryCTAButton({
  label,
  variant = "default",
  loading = false,
  disabled,
  style,
  ...rest
}: Props) {
  const palette = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.background },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.bodyMedium,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.45,
  },
});
