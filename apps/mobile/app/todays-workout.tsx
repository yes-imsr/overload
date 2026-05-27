import { router } from "expo-router";
import { PrimaryCTAButton } from "@/components";
import { ScreenShell } from "@/screens/ScreenShell";

export default function TodaysWorkoutScreen() {
  return (
    <ScreenShell
      title="Today's Workout"
      subtitle="Template shell — workout logic not implemented."
    >
      <PrimaryCTAButton
        label="Open Active Workout"
        onPress={() => router.push("/active-workout")}
      />
    </ScreenShell>
  );
}
