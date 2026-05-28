import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
  loading?: boolean;
};

export function SystemState({ eyebrow, title, body, loading = false }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        {loading ? (
          <ActivityIndicator color={colors.text.primary} />
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  panel: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: radius.md,
    backgroundColor: colors.background.elevated,
    padding: spacing.lg,
  },
  eyebrow: {
    ...typography.label,
    color: colors.accent.power,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
});
