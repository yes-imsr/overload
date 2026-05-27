import { ResourceStat } from "@/components";
import { ScreenShell } from "@/screens/ScreenShell";
import { spacing } from "@/tokens";
import { StyleSheet, View } from "react-native";

export default function NodesScreen() {
  return (
    <ScreenShell
      title="Nodes"
      subtitle="Idle economy shell — node chain not implemented."
    >
      <View style={styles.stats}>
        <ResourceStat label="Unclaimed Power" value="0" kind="power" />
        <ResourceStat label="Credits Rate" value="0/h" kind="credits" />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stats: {
    gap: spacing.md,
  },
});
