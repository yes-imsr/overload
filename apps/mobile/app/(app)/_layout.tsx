import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useOnboardingRedirectState } from "@/hooks/use-onboarding-redirect";
import { colors, spacing, typography } from "@/tokens";

export default function MainAppLayout() {
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
      <Tabs.Screen name="delete-account" options={{ href: null }} />
    </Tabs>
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
