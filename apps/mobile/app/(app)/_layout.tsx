import { Tabs } from "expo-router";
import { Redirect } from "expo-router";
import { SystemState } from "@/components";
import { useProfileQuery } from "@/features/onboarding/api";
import { useAuth } from "@/providers/auth-provider";
import { colors, spacing, typography } from "@/tokens";

export default function MainAppLayout() {
  const { isConfigured, isLoading, user } = useAuth();
  const profileQuery = useProfileQuery(user?.id);

  if (!isConfigured) {
    return <Redirect href="/onboarding" />;
  }

  if (isLoading || (user && profileQuery.isLoading)) {
    return (
      <SystemState
        eyebrow="Routing"
        title="Checking command access"
        loading
      />
    );
  }

  if (!user || profileQuery.data?.onboarding_status !== "complete") {
    return <Redirect href="/onboarding" />;
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
