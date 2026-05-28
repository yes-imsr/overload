import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

export type RouteHref =
  | "/onboarding"
  | "/home"
  | "/workouts"
  | "/economy"
  | "/profile";

export type NavigationTarget = {
  label: string;
  href: RouteHref;
  tone?: "standard" | "economy" | "success" | "danger";
};

type PlaceholderScreenProps = {
  eyebrow: string;
  title: string;
  body: string;
  navigation: NavigationTarget[];
  children?: ReactNode;
};

export function PlaceholderScreen({
  eyebrow,
  title,
  body,
  navigation,
  children,
}: PlaceholderScreenProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {children}
      </View>

      <View style={styles.navPanel}>
        <Text style={styles.navTitle}>Route matrix</Text>
        <View style={styles.navGrid}>
          {navigation.map((item) => {
            const tone = item.tone ?? "standard";

            return (
              <Pressable
                key={item.href}
                accessibilityRole="button"
                onPress={() => router.push(item.href)}
                style={StyleSheet.flatten([styles.navButton, toneStyles[tone]])}
              >
                <Text style={styles.navButtonText}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const toneStyles = StyleSheet.create({
  standard: {
    borderColor: colors.background.border,
  },
  economy: {
    borderColor: colors.accent.credits,
  },
  success: {
    borderColor: colors.accent.success,
  },
  danger: {
    borderColor: colors.accent.danger,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
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
    ...typography.display,
    color: colors.text.primary,
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  navPanel: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: radius.md,
    backgroundColor: colors.background.surface,
    padding: spacing.md,
  },
  navTitle: {
    ...typography.label,
    color: colors.text.muted,
  },
  navGrid: {
    gap: spacing.sm,
  },
  navButton: {
    borderWidth: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  navButtonText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
});
