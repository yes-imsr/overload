import { PrimaryCTAButton, ResourceStat } from "@/components";
import {
  formatBalance,
  formatCreditsRate,
} from "@/features/economy/format";
import { useEconomySnapshot } from "@/features/economy/queries";
import { useAuthSession } from "@/features/onboarding/queries";
import { ScreenShell } from "@/screens/ScreenShell";
import { spacing, colors, typography } from "@/tokens";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function HomeRoute() {
  const session = useAuthSession();
  const userId = session.data?.user.id;
  const economy = useEconomySnapshot(userId);

  return (
    <ScreenShell
      title="Home console"
      subtitle="Server-owned Power, Credits, and node state."
    >
      {economy.isLoading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : economy.error ? (
        <Text style={styles.error}>Unable to load economy state.</Text>
      ) : economy.data ? (
        <>
          <View style={styles.stats}>
            <ResourceStat
              label="Stored Power"
              value={formatBalance(economy.data.powerBalance)}
              kind="power"
            />
            <ResourceStat
              label="Credits balance"
              value={formatBalance(economy.data.creditsBalance)}
              kind="credits"
            />
            <ResourceStat
              label="Unclaimed Credits"
              value={formatBalance(economy.data.pendingCredits)}
              kind="credits"
            />
            <ResourceStat
              label="Idle rate"
              value={formatCreditsRate(economy.data.creditsPerHourAtCurrentPower)}
              kind="credits"
            />
          </View>

          <View style={styles.actions}>
            <PrimaryCTAButton
              label="Claim Credits"
              variant="credits"
              onPress={() => router.push("/(app)/economy")}
            />
            <PrimaryCTAButton
              label="Open node bay"
              onPress={() => router.push("/nodes")}
            />
            <PrimaryCTAButton
              label="Workout bay"
              variant="success"
              onPress={() => router.push("/(app)/workouts")}
            />
          </View>
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stats: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
});
