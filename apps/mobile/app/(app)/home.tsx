import { DebuffCard, PrimaryCTAButton, ResourceStat } from "@/components";
import {
  formatBalance,
  formatCreditsRate,
} from "@/features/economy/format";
import { useEconomySnapshot } from "@/features/economy/queries";
import { formatEntropy } from "@/features/stability/format";
import { useStabilitySnapshot } from "@/features/stability/queries";
import { useAuthSession } from "@/features/onboarding/queries";
import { ScreenShell } from "@/screens/ScreenShell";
import { spacing, colors, typography } from "@/tokens";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function HomeRoute() {
  const session = useAuthSession();
  const userId = session.data?.user.id;
  const economy = useEconomySnapshot(userId);
  const stability = useStabilitySnapshot(userId);

  const isLoading = economy.isLoading || stability.isLoading;
  const hasError = economy.error || stability.error;

  return (
    <ScreenShell
      title="Home console"
      subtitle="Server-owned Power, Credits, Entropy, and Stability Task state."
    >
      {isLoading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : hasError ? (
        <Text style={styles.error}>Unable to load console state.</Text>
      ) : economy.data && stability.data ? (
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
            <ResourceStat
              label="Entropy"
              value={formatEntropy(stability.data.entropy)}
              kind="entropy"
              elevated={stability.data.entropyRisk}
            />
          </View>

          {stability.data.debuff ? (
            <DebuffCard debuff={stability.data.debuff} />
          ) : stability.data.entropyRisk ? (
            <Text style={styles.riskCopy}>Entropy Rising — monitor system stability.</Text>
          ) : (
            <Text style={styles.safeCopy}>Entropy low. Progression safe.</Text>
          )}

          <View style={styles.actions}>
            <PrimaryCTAButton
              label="Claim Credits"
              variant="credits"
              onPress={() => router.push("/(app)/economy")}
            />
            {stability.data.debuff ? (
              <PrimaryCTAButton
                label={
                  stability.data.canReveal
                    ? "Accept Stability Task"
                    : stability.data.canResolve
                      ? "Complete Stability Task"
                      : "View Stability Task"
                }
                variant="danger"
                onPress={() => router.push("/debuff")}
              />
            ) : null}
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
  safeCopy: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  riskCopy: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
});
