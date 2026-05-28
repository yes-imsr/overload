import { Redirect, Tabs } from "expo-router";
import { useOnboardingRedirect } from "@/hooks/use-onboarding-redirect";
import { colors, spacing, typography } from "@/tokens";

export default function MainAppLayout() {
  const redirect = useOnboardingRedirect({ guardApp: true });

  if (redirect) {
    return <Redirect href={redirect} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: typography.caption,
        tabBarStyle: {
          minHeight: 64,
          borderTopColor: colors.background.border,
          backgroundColor: colors.background.elevated,
          paddingTop: spacing.xs,
        },
        sceneStyle: {
          backgroundColor: colors.background.primary,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="workouts" options={{ title: "Workouts" }} />
      <Tabs.Screen name="economy" options={{ title: "Economy" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
