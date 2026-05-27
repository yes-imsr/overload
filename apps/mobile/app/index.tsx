import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import {
  CommandCard,
  PrimaryCTAButton,
  ResourceStat,
} from "@/components";
import { ScreenShell } from "@/screens/ScreenShell";
import { spacing } from "@/tokens";

/** Intro / Welcome */
export default function WelcomeScreen() {
  return (
    <ScreenShell
      title="Overload"
      subtitle="System online. Initialize training profile to begin."
    >
      <View style={styles.stats}>
        <ResourceStat label="Power" value="—" kind="power" />
        <ResourceStat label="Credits" value="—" kind="credits" />
      </View>
      <CommandCard
        title="Command Center"
        subtitle="Route shell — no live data yet"
        statusLabel="IDLE"
      />
      <PrimaryCTAButton
        label="Initialize Profile"
        variant="default"
        onPress={() => router.push("/training-profile")}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row",
    gap: spacing.xl,
  },
});
