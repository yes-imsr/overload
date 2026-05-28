import { Redirect, Stack, usePathname } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useOnboardingRedirectState } from "@/hooks/use-onboarding-redirect";
import { colors } from "@/tokens";

export default function AuthLayout() {
  const pathname = usePathname();
  const { redirect, isLoading } = useOnboardingRedirectState({ guardApp: false });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text.primary} />
      </View>
    );
  }

  if (redirect) {
    const canAccessSignedOutRoute =
      redirect === "/welcome" && (pathname === "/welcome" || pathname === "/sign-in");

    if (!canAccessSignedOutRoute && pathname !== redirect) {
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
  },
});
