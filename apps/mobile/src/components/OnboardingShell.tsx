import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@/tokens";

type Props = {
  eyebrow: string;
  title: string;
  body: string;
  step?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function OnboardingShell({
  eyebrow,
  title,
  body,
  step,
  children,
  footer,
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            {step ? <Text style={styles.step}>{step}</Text> : null}
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>

        <View style={styles.content}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    ...typography.caption,
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  step: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
    gap: spacing.md,
  },
  footer: {
    gap: spacing.md,
  },
});
