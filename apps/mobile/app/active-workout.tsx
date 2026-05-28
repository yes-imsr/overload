import { CalibrationBadge, PrimaryCTAButton } from "@/components";
import { ScreenShell } from "@/screens/ScreenShell";
import { spacing } from "@/tokens";
import { StyleSheet, View } from "react-native";

export default function ActiveWorkoutScreen() {
  return (
    <ScreenShell
      title="Active Workout"
      subtitle="Set logger shell — logging flow not implemented."
    >
      <View style={styles.row}>
        <CalibrationBadge state="uncalibrated" />
      </View>
      <PrimaryCTAButton label="Complete Set" disabled />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
  },
});
