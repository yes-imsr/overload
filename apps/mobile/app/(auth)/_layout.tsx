import { Redirect, Stack } from "expo-router";
import { useOnboardingRedirect } from "@/hooks/use-onboarding-redirect";
import { colors } from "@/tokens";

export default function AuthLayout() {
  const redirect = useOnboardingRedirect({ guardApp: false });

  if (redirect === "/home") {
    return <Redirect href="/home" />;
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
