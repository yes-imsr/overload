import { Redirect, Stack, usePathname } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useOnboardingRedirectState } from "@/hooks/use-onboarding-redirect";
import { colors, typography } from "@/tokens";

export default function AuthLayout() {
  const pathname = usePathname();
  const { redirect, isLoading, error } = useOnboardingRedirectState({ guardApp: false });

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
    const signedOutRoutes = new Set([
      "/welcome",
      "/sign-in",
      "/forgot-password",
      "/auth/callback",
      "/reset-password",
    ]);
    const recoveryRoutes = new Set(["/auth/callback", "/reset-password"]);
    const canAccessSignedOutRoute =
      redirect === "/welcome" && signedOutRoutes.has(pathname);
    const canAccessRecoveryRoute = recoveryRoutes.has(pathname);

    if (!canAccessSignedOutRoute && !canAccessRecoveryRoute && pathname !== redirect) {
      return <Redirect href={redirect} />;
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="training-profile" />
      <Stack.Screen name="equipment" />
    </Stack>
  );
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
