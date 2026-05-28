import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

type Props = Omit<PressableProps, "style"> & {
  title: string;
  subtitle?: string;
  statusLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function CommandCard({
  title,
  subtitle,
  statusLabel,
  style,
  ...rest
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        style,
      ]}
      {...rest}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {statusLabel ? (
          <Text style={styles.status}>{statusLabel}</Text>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.background.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.92,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  status: {
    ...typography.label,
    color: colors.text.secondary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
