import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { QueryProvider } from "@/providers/QueryProvider";
import { colors } from "@/tokens";

export default function RootLayout() {
  return (
    <QueryProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background.primary },
            headerTintColor: colors.text.primary,
            headerTitleStyle: { fontWeight: "600" },
            contentStyle: { backgroundColor: colors.background.primary },
            animation: "fade",
          }}
        >
          <Stack.Screen name="index" options={{ title: "Welcome" }} />
          <Stack.Screen name="training-profile" options={{ title: "Training Profile" }} />
          <Stack.Screen name="home" options={{ title: "Command Center" }} />
          <Stack.Screen name="todays-workout" options={{ title: "Today's Workout" }} />
          <Stack.Screen name="active-workout" options={{ title: "Active Workout" }} />
          <Stack.Screen name="calibration" options={{ title: "Calibration" }} />
          <Stack.Screen name="nodes" options={{ title: "Nodes" }} />
          <Stack.Screen name="debuff" options={{ title: "Debuff" }} />
          <Stack.Screen name="prestige" options={{ title: "Prestige" }} />
          <Stack.Screen name="profile" options={{ title: "Profile" }} />
        </Stack>
      </View>
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});
