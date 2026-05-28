import { router } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CalibrationBadge, FormField, PrimaryCTAButton, RPESelector } from "@/components";
import { useAuthSession } from "@/features/onboarding/queries";
import { useCompleteWorkoutSession } from "@/features/workouts/queries";
import { toCalibrationUiState } from "@overload/core-engine";
import { ScreenShell } from "@/screens/ScreenShell";
import {
  createClientSetKey,
  getCompletedDraftSets,
  useActiveWorkoutDraftStore,
} from "@/state/active-workout-draft-store";
import { colors, spacing, typography } from "@/tokens";

export default function ActiveWorkoutScreen() {
  const session = useAuthSession();
  const userId = session.data?.user.id;
  const draft = useActiveWorkoutDraftStore((state) => state.draft);
  const updateCurrentSet = useActiveWorkoutDraftStore((state) => state.updateCurrentSet);
  const completeCurrentSet = useActiveWorkoutDraftStore((state) => state.completeCurrentSet);
  const setCurrentExerciseIndex = useActiveWorkoutDraftStore((state) => state.setCurrentExerciseIndex);
  const editSet = useActiveWorkoutDraftStore((state) => state.editSet);
  const clearDraft = useActiveWorkoutDraftStore((state) => state.clearDraft);
  const completeWorkout = useCompleteWorkoutSession(userId);

  const currentExercise = draft?.exercises[draft.currentExerciseIndex];
  const currentSet = currentExercise?.sets[currentExercise.sets.length - 1];

  const completedSetCount = useMemo(() => {
    if (!draft) {
      return 0;
    }
    return getCompletedDraftSets(draft).length;
  }, [draft]);

  if (!draft || !currentExercise || !currentSet) {
    return (
      <ScreenShell title="Active Workout" subtitle="No active draft. Start from Today's Workout.">
        <PrimaryCTAButton label="Open Today's Workout" onPress={() => router.push("/todays-workout")} />
      </ScreenShell>
    );
  }

  const handleCompleteSet = () => {
    const weight = Number(currentSet.weight);
    const reps = Number(currentSet.reps);
    if (!currentSet.effort || !Number.isFinite(weight) || !Number.isFinite(reps) || reps <= 0) {
      return;
    }
    completeCurrentSet();
  };

  const handleCompleteWorkout = async () => {
    if (!draft.sessionId) {
      return;
    }

    const payloadSets = draft.exercises.flatMap((exercise) =>
      exercise.sets
        .filter((set) => set.effort && set.weight && set.reps)
        .map((set) => ({
          exerciseId: exercise.exerciseId,
          equipmentId: exercise.equipmentId,
          setOrder: set.setOrder,
          weight: Number(set.weight),
          reps: Number(set.reps),
          effort: set.effort!,
          clientSetKey: createClientSetKey(
            draft.clientSessionKey,
            exercise.exerciseId,
            set.setOrder,
          ),
        })),
    );

    await completeWorkout.mutateAsync({
      sessionId: draft.sessionId,
      clientMutationId: `${draft.clientSessionKey}-complete`,
      sets: payloadSets,
    });

    clearDraft();
    router.replace("/todays-workout");
  };

  return (
    <ScreenShell
      title={draft.templateName}
      subtitle={`Set ${currentSet.setOrder} · ${currentExercise.name}`}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.exerciseTabs}>
          {draft.exercises.map((exercise, index) => (
            <Pressable
              key={exercise.exerciseId}
              onPress={() => setCurrentExerciseIndex(index)}
              style={[
                styles.exerciseTab,
                index === draft.currentExerciseIndex && styles.exerciseTabActive,
              ]}
            >
              <Text style={styles.exerciseTabText}>{exercise.name}</Text>
            </Pressable>
          ))}
        </View>

        <CalibrationBadge state={toCalibrationUiState("uncalibrated")} />

        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>TARGET</Text>
          <Text style={styles.targetValue}>
            {currentExercise.targetSets} sets · {currentExercise.targetRepMin}-
            {currentExercise.targetRepMax} reps
          </Text>
        </View>

        <FormField
          label="Weight (lb)"
          keyboardType="decimal-pad"
          value={currentSet.weight}
          onChangeText={(weight) => updateCurrentSet({ weight })}
        />
        <FormField
          label="Reps"
          keyboardType="number-pad"
          value={currentSet.reps}
          onChangeText={(reps) => updateCurrentSet({ reps })}
        />

        <View style={styles.effortBlock}>
          <Text style={styles.effortLabel}>EFFORT</Text>
          <RPESelector
            value={currentSet.effort ?? undefined}
            onChange={(effort) => updateCurrentSet({ effort })}
          />
        </View>

        <PrimaryCTAButton label="Complete Set" onPress={handleCompleteSet} />

        {currentExercise.sets
          .filter((set) => set.effort && set.weight && set.reps && set !== currentSet)
          .map((set) => (
            <View key={set.setOrder} style={styles.loggedSet}>
              <Text style={styles.loggedSetText}>
                Set {set.setOrder}: {set.weight} lb x {set.reps}
              </Text>
              <Pressable
                onPress={() =>
                  editSet(draft.currentExerciseIndex, set.setOrder, {
                    weight: set.weight,
                    reps: set.reps,
                  })
                }
              >
                <Text style={styles.editLink}>Edit</Text>
              </Pressable>
            </View>
          ))}

        <PrimaryCTAButton
          label={`Complete Workout (${completedSetCount} sets)`}
          disabled={completedSetCount === 0 || completeWorkout.isPending}
          onPress={handleCompleteWorkout}
        />

        {completeWorkout.isPending ? (
          <ActivityIndicator color={colors.text.primary} />
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  exerciseTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  exerciseTab: {
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.elevated,
  },
  exerciseTabActive: {
    borderColor: colors.text.secondary,
  },
  exerciseTabText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  targetRow: {
    gap: spacing.xs,
  },
  targetLabel: {
    ...typography.label,
    color: colors.text.secondary,
  },
  targetValue: {
    ...typography.body,
    color: colors.text.primary,
  },
  effortBlock: {
    gap: spacing.sm,
  },
  effortLabel: {
    ...typography.label,
    color: colors.text.secondary,
  },
  loggedSet: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: 8,
    padding: spacing.sm,
    backgroundColor: colors.background.surface,
  },
  loggedSetText: {
    ...typography.body,
    color: colors.text.primary,
  },
  editLink: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
