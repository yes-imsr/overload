import { DebuffCard, PrimaryCTAButton } from "@/components";
import { useAuthSession } from "@/features/onboarding/queries";
import {
  useRevealStabilityTask,
  useResolveStabilityTask,
  useStabilitySnapshot,
} from "@/features/stability/queries";
import { useInProgressWorkoutSession } from "@/features/workouts/queries";
import { ScreenShell } from "@/screens/ScreenShell";
import { colors, spacing, typography } from "@/tokens";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

/** Stability Task reveal and resolution */
export default function DebuffRevealScreen() {
  const session = useAuthSession();
  const userId = session.data?.user.id;
  const stability = useStabilitySnapshot(userId);
  const inProgressWorkout = useInProgressWorkoutSession(userId);
  const revealTask = useRevealStabilityTask(userId);
  const resolveTask = useResolveStabilityTask(userId);

  const debuff = stability.data?.debuff;
  const inProgressSessionId = inProgressWorkout.data?.id;

  return (
    <ScreenShell
      title="System Alert"
      subtitle="Entropy Spike — safe recovery protocol."
    >
      {stability.isLoading || inProgressWorkout.isLoading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : stability.error ? (
        <Text style={styles.error}>Debuff state unavailable. Continue training; system will retry.</Text>
      ) : debuff ? (
        <View style={styles.stack}>
          <DebuffCard debuff={debuff} />

          {stability.data?.canReveal ? (
            <>
              {inProgressSessionId ? (
                <PrimaryCTAButton
                  label="Accept Stability Task"
                  variant="danger"
                  loading={revealTask.isPending}
                  onPress={() =>
                    revealTask.mutate({
                      debuffId: debuff.id,
                      sessionId: inProgressSessionId,
                    })
                  }
                />
              ) : (
                <>
                  <Text style={styles.helper}>
                    Start a workout session to reveal the Stability Task.
                  </Text>
                  <PrimaryCTAButton
                    label="Go to workout bay"
                    variant="success"
                    onPress={() => router.push("/(app)/workouts")}
                  />
                </>
              )}
            </>
          ) : null}

          {stability.data?.canResolve ? (
            <PrimaryCTAButton
              label="Complete Stability Task"
              variant="danger"
              loading={resolveTask.isPending}
              onPress={() => resolveTask.mutate(debuff.id)}
            />
          ) : null}
        </View>
      ) : (
        <Text style={styles.helper}>No active Stability Task. Entropy is within safe range.</Text>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  helper: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
});
