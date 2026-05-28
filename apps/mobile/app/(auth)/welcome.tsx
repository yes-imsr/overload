import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useOnboardingRedirect } from "@/hooks/use-onboarding-redirect";
import { PrimaryCTAButton } from "@/components";
import { OnboardingShell } from "@/components/OnboardingShell";
import { isSupabaseConfigured } from "@/lib/supabase";
import { colors, spacing, typography } from "@/tokens";

const PROMISES = ["Log Output", "Earn Credits", "Manage Consequences"] as const;

export default function WelcomeScreen() {
  const route = useOnboardingRedirect();

  useEffect(() => {
    if (route && route !== "/welcome" && route !== "/sign-in") {
      router.replace(route);
    }
  }, [route]);

  return (
    <OnboardingShell
      eyebrow="Overload"
      title="Training creates signal."
      body="The system adapts to your output. Initialize your operator profile to enter the reactor console."
      footer={
        <>
          {!isSupabaseConfigured() ? (
            <Text style={styles.configWarning}>
              Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart Metro.
            </Text>
          ) : null}
          <PrimaryCTAButton
            label="Initialize Training System"
            variant="success"
            disabled={!isSupabaseConfigured()}
            onPress={() => router.push("/sign-in")}
          />
          <PrimaryCTAButton
            label="Restore session"
            onPress={() => router.push("/sign-in")}
            disabled={!isSupabaseConfigured()}
          />
        </>
      }
    >
      <View style={styles.promises}>
        {PROMISES.map((item) => (
          <View key={item} style={styles.promiseRow}>
            <Text style={styles.promiseLabel}>{item}</Text>
          </View>
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  promises: {
    gap: spacing.sm,
  },
  promiseRow: {
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.background.surface,
  },
  promiseLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  configWarning: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
});
