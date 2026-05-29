import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryCTAButton, ResourceStat } from "@/components";
import {
  formatEconomyNumber,
  useEconomyState,
} from "@/features/economy/queries";
import { useAuthSession } from "@/features/onboarding/queries";
import { ScreenShell } from "@/screens/ScreenShell";
import { colors, spacing, typography } from "@/tokens";

export default function HomeRoute() {
  const { data: session } = useAuthSession();
  const economyState = useEconomyState(session?.user.id);
  const gameState = economyState.data?.gameState;

  return (
    <ScreenShell
      title="Home console"
      subtitle="Server-owned workout output feeds Power, Credits, and the MVP node chain."
    >
      <View style={styles.stats}>
        <ResourceStat
          label="Power"
          value={formatEconomyNumber(gameState?.power_balance)}
          kind="power"
        />
        <ResourceStat
          label="Credits"
          value={formatEconomyNumber(gameState?.credits_balance)}
          kind="credits"
        />
        <ResourceStat
          label="Credits rate"
          value={`${formatEconomyNumber(gameState?.idle_rate)}/h`}
          kind="credits"
        />
      </View>

      {economyState.error instanceof Error ? (
        <Text style={styles.error}>{economyState.error.message}</Text>
      ) : null}

      <View style={styles.actions}>
        <PrimaryCTAButton
          label="Open Workout Bay"
          onPress={() => router.push("/(app)/workouts")}
        />
        <PrimaryCTAButton
          label="Claim Credits"
          variant="credits"
          onPress={() => router.push("/(app)/economy")}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
});
