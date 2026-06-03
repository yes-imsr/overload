import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useOnboardingRedirectState } from "@/hooks/use-onboarding-redirect";
import { colors } from "@/tokens";

export default function IndexRoute() {
  const { redirect, isLoading } = useOnboardingRedirectState();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text.primary} />
      </View>
    );
  }

  if (!redirect) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text.primary} />
      </View>
    );
  }

  return <Redirect href={redirect} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.primary,
  },
});
