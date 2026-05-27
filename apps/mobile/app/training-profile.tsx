import { router } from "expo-router";
import { PrimaryCTAButton } from "@/components";
import { ScreenShell } from "@/screens/ScreenShell";

export default function TrainingProfileScreen() {
  return (
    <ScreenShell
      title="Training Profile"
      subtitle="Select training focus. Placeholder — no persistence yet."
    >
      <PrimaryCTAButton
        label="Continue to Command Center"
        onPress={() => router.replace("/home")}
      />
    </ScreenShell>
  );
}
