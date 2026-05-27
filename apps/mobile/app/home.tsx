import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { CommandCard, ResourceStat } from "@/components";
import { ScreenShell } from "@/screens/ScreenShell";
import { spacing } from "@/tokens";

/** Home / Command Center */
export default function HomeScreen() {
  return (
    <ScreenShell title="Command Center" subtitle="System Stable">
      <View style={styles.stats}>
        <ResourceStat label="Power" value="0" kind="power" />
        <ResourceStat label="Credits" value="0" kind="credits" />
        <ResourceStat label="Entropy" value="0" kind="entropy" />
      </View>
      <CommandCard
        title="Today's Workout"
        subtitle="No session scheduled"
        onPress={() => router.push("/todays-workout")}
      />
      <CommandCard
        title="Nodes"
        subtitle="Idle economy offline"
        onPress={() => router.push("/nodes")}
      />
      <CommandCard
        title="Calibration"
        onPress={() => router.push("/calibration")}
      />
      <CommandCard
        title="Profile"
        subtitle="Stats and system meta"
        onPress={() => router.push("/profile")}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },
});
