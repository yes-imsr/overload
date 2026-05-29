import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { CommandCard, PrimaryCTAButton } from "@/components";
import {
  useActiveStabilityTask,
  useRevealStabilityTask,
  useResolveStabilityTask,
} from "@/features/game/queries";
import { useAuthSession } from "@/features/onboarding/queries";
import { ScreenShell } from "@/screens/ScreenShell";
import { colors, spacing, typography } from "@/tokens";

export default function DebuffRevealScreen() {
  const { data: session } = useAuthSession();
  const userId = session?.user.id;
  const {
    data: stabilityTask,
    isLoading: isTaskLoading,
  } = useActiveStabilityTask(userId);
  const revealTask = useRevealStabilityTask(userId);
  const resolveTask = useResolveStabilityTask(userId);

  const mutationError = revealTask.error ?? resolveTask.error;

  return (
    <ScreenShell
      title="Stability Task"
      subtitle="A safe Recovery Challenge for an Entropy Spike."
    >
      {isTaskLoading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : stabilityTask ? (
        <View style={styles.stack}>
          <CommandCard
            title={
              stabilityTask.status === "pending_reveal"
                ? "Entropy Spike"
                : "Recovery Challenge"
            }
            subtitle={
              stabilityTask.status === "pending_reveal"
                ? "Accept the Stability Task to review the safe recovery action. No extra effort is required."
                : "Confirm the recovery check-in is complete. Choose safe loads in your next workout; this action clears the MVP task without extra exertion."
            }
            statusLabel={
              stabilityTask.status === "pending_reveal"
                ? "PENDING REVEAL"
                : "ACTIVE"
            }
            style={styles.riskCard}
          />

          <Text style={styles.copy}>
            The Overload Task is recoverable. Stop if anything feels unsafe and
            return when ready.
          </Text>

          {mutationError ? (
            <Text style={styles.error}>
              {mutationError instanceof Error
                ? mutationError.message
                : "Stability Task action failed."}
            </Text>
          ) : null}

          {stabilityTask.status === "pending_reveal" ? (
            <PrimaryCTAButton
              label="Accept Stability Task"
              variant="danger"
              loading={revealTask.isPending}
              onPress={() => revealTask.mutate()}
            />
          ) : (
            <PrimaryCTAButton
              label="Resolve Stability Task"
              variant="success"
              loading={resolveTask.isPending}
              onPress={() => resolveTask.mutate()}
            />
          )}
        </View>
      ) : (
        <View style={styles.stack}>
          <CommandCard
            title="No active Stability Task"
            subtitle="System risk is clear. Continue the MVP loop from the home console."
            statusLabel="CLEAR"
          />
          <PrimaryCTAButton
            label="Return Home"
            onPress={() => router.push("/(app)/home")}
          />
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  riskCard: {
    borderColor: colors.accent.danger,
  },
  copy: {
    ...typography.body,
    color: colors.text.secondary,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
});
