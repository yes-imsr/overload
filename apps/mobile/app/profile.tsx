import { router } from "expo-router";
import { CommandCard } from "@/components";
import { ScreenShell } from "@/screens/ScreenShell";

/** Profile / Stats */
export default function ProfileScreen() {
  return (
    <ScreenShell title="Profile" subtitle="Stats shell — no backend sync.">
      <CommandCard
        title="Prestige"
        subtitle="View prestige window"
        onPress={() => router.push("/prestige")}
      />
      <CommandCard
        title="Debuff History"
        subtitle="Reveal flow placeholder"
        onPress={() => router.push("/debuff")}
      />
    </ScreenShell>
  );
}
