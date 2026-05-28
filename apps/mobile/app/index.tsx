import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useOnboardingRedirect } from "@/hooks/use-onboarding-redirect";
import { colors } from "@/tokens";

export default function IndexRoute() {
  const route = useOnboardingRedirect();

  if (!route) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text.primary} />
      </View>
    );
  }

  return <Redirect href={route} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.primary,
  },
});
