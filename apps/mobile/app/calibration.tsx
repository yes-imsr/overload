import { StyleSheet, View } from "react-native";
import { CalibrationBadge } from "@/components";
import { ScreenShell } from "@/screens/ScreenShell";
import { spacing } from "@/tokens";

export default function CalibrationScreen() {
  return (
    <ScreenShell
      title="Calibration Status"
      subtitle="Exercise readiness states — display only."
    >
      <View style={styles.badges}>
        <CalibrationBadge state="uncalibrated" />
        <CalibrationBadge state="provisional" />
        <CalibrationBadge state="calibrated" />
        <CalibrationBadge state="stale" />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
