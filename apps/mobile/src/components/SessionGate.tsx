import { Redirect } from "expo-router";
import { PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useOnboardingRedirectState } from "@/hooks/use-onboarding-redirect";
import { colors, typography } from "@/tokens";

/** Blocks signed-out and incomplete-onboarding users from protected routes. */
export function SessionGate({ children }: PropsWithChildren) {
  const { redirect, isLoading, error } = useOnboardingRedirectState({ guardApp: true });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (redirect) {
    return <Redirect href={redirect} />;
  }

  return children;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.primary,
    padding: 24,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
    textAlign: "center",
  },
});
