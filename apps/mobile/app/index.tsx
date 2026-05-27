import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/tokens";

export default function AppShell() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Overload</Text>
      <Text style={styles.subtitle}>Expo app shell</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
});
