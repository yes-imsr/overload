import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { PrimaryCTAButton, ResourceStat } from "@/components";
import { CommandCard } from "@/components/CommandCard";
import {
  useActiveStabilityTask,
  useGameState,
} from "@/features/game/queries";
import { useAuthSession } from "@/features/onboarding/queries";
import { colors, spacing, typography } from "@/tokens";

export default function HomeRoute() {
  const { data: session } = useAuthSession();
  const userId = session?.user.id;
  const { data: gameState, isLoading: isGameStateLoading } = useGameState(userId);
  const { data: stabilityTask, isLoading: isTaskLoading } =
    useActiveStabilityTask(userId);

  const entropy = gameState?.entropy ?? 0;
  const hasStabilityTask = Boolean(stabilityTask);
  const isEntropyRisk = hasStabilityTask || gameState?.status === "debuffed";
  const isLoading = isGameStateLoading || isTaskLoading;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>COMMAND CENTER</Text>
      <Text style={styles.title}>Home console</Text>
      <Text style={styles.body}>
        Server-owned workout, economy, and Stability Task state. Entropy changes
        are calculated outside the UI.
      </Text>

      <View style={styles.stats}>
        <ResourceStat
          label="Power"
          value={isLoading ? "--" : String(gameState?.power_balance ?? 0)}
          kind="power"
        />
        <ResourceStat
          label="Credits"
          value={isLoading ? "--" : String(gameState?.credits_balance ?? 0)}
          kind="credits"
        />
        <ResourceStat
          label="Entropy"
          value={isLoading ? "--" : String(entropy)}
          kind={isEntropyRisk ? "risk" : "entropy"}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : hasStabilityTask ? (
        <CommandCard
          title="Entropy Spike detected"
          subtitle={
            stabilityTask?.status === "pending_reveal"
              ? "A Stability Task is ready. Reveal it to start the Recovery Challenge."
              : "Recovery Challenge active. Resolve it with the safe MVP action."
          }
          statusLabel={
            stabilityTask?.status === "pending_reveal" ? "REVEAL" : "ACTIVE"
          }
          style={styles.riskCard}
          onPress={() => router.push("/debuff")}
        />
      ) : (
        <CommandCard
          title="Training route stable"
          subtitle="No active Stability Task. Continue with the next planned workout."
          statusLabel="CLEAR"
        />
      )}

      <PrimaryCTAButton
        label={hasStabilityTask ? "View Stability Task" : "Open Today's Workout"}
        variant={hasStabilityTask ? "danger" : "default"}
        onPress={() => router.push(hasStabilityTask ? "/debuff" : "/todays-workout")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    gap: spacing.md,
  },
  eyebrow: {
    ...typography.label,
    color: colors.text.secondary,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  riskCard: {
    borderColor: colors.accent.danger,
  },
});
