import { Stack } from "expo-router";
import { colors } from "@/tokens";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
      }}
    >
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
