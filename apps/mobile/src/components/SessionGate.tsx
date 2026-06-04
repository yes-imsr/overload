import { Redirect } from "expo-router";
import { PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useOnboardingRedirectState } from "@/hooks/use-onboarding-redirect";
import { colors } from "@/tokens";

/** Blocks signed-out and incomplete-onboarding users from protected routes. */
export function SessionGate({ children }: PropsWithChildren) {
  const { redirect, isLoading } = useOnboardingRedirectState({ guardApp: true });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text.primary} />
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
});
