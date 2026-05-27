import { PrimaryCTAButton, ResourceStat } from "@/components";
import { ScreenShell } from "@/screens/ScreenShell";
import { spacing } from "@/tokens";
import { StyleSheet, View } from "react-native";

export default function PrestigeScreen() {
  return (
    <ScreenShell
      title="Prestige Window"
      subtitle="Prestige flow shell — eligibility not implemented."
    >
      <View style={styles.stats}>
        <ResourceStat label="Entropy" value="0" kind="entropy" />
      </View>
      <PrimaryCTAButton label="Attempt Prestige" variant="danger" disabled />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stats: {
    marginBottom: spacing.md,
  },
});
