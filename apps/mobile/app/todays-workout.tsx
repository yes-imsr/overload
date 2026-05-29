import { router } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryCTAButton } from "@/components";
import { CommandCard } from "@/components/CommandCard";
import { useAuthSession, useEquipment, useProfile } from "@/features/onboarding/queries";
import {
  useEnsureStarterTemplate,
  useStartWorkoutSession,
  useStarterTemplate,
} from "@/features/workouts/queries";
import { getProgressionReasonText } from "@/features/workouts/progression-copy";
import type { WorkoutTemplateExercise } from "@/features/workouts/types";
import { ScreenShell } from "@/screens/ScreenShell";
import {
  buildDraftFromTemplate,
  createClientSessionKey,
  useActiveWorkoutDraftStore,
} from "@/state/active-workout-draft-store";
import { colors, spacing, typography } from "@/tokens";

function formatWeightTarget(weight: number | null): string | null {
  if (weight === null || weight <= 0) {
    return null;
  }

  return `${Number.isInteger(weight) ? weight : weight.toFixed(2)} lb`;
}

function formatExerciseTarget(row: WorkoutTemplateExercise): string {
  const weightTarget = formatWeightTarget(row.planned_weight);
  const repTarget =
    row.target_rep_min === row.target_rep_max
      ? `${row.target_rep_max} reps`
      : `${row.target_rep_min}-${row.target_rep_max} reps`;
  return [weightTarget, `${row.target_sets} sets`, repTarget].filter(Boolean).join(" · ");
}

export default function TodaysWorkoutScreen() {
  const session = useAuthSession();
  const userId = session.data?.user.id;
  const profile = useProfile(userId);
  const equipment = useEquipment(userId);
  const starterTemplate = useStarterTemplate(userId);
  const ensureStarterTemplate = useEnsureStarterTemplate(userId, profile.data, equipment.data);
  const startSession = useStartWorkoutSession(userId);
  const startDraft = useActiveWorkoutDraftStore((state) => state.startDraft);
  const attachSessionId = useActiveWorkoutDraftStore((state) => state.attachSessionId);
  const existingDraft = useActiveWorkoutDraftStore((state) => state.draft);

  const isLoading =
    session.isLoading ||
    profile.isLoading ||
    equipment.isLoading ||
    starterTemplate.isLoading;

  const handleStartWorkout = async () => {
    if (!userId || !profile.data || !equipment.data) {
      return;
    }

    await ensureStarterTemplate.mutateAsync();
    const refreshed = await starterTemplate.refetch();
    const templateData = refreshed.data;
    if (!templateData) {
      return;
    }

    const clientSessionKey = createClientSessionKey();
    const draft = buildDraftFromTemplate({
      templateId: templateData.template.id,
      templateName: templateData.template.name,
      clientSessionKey,
      exercises: templateData.exercises.map((row) => ({
        exerciseId: row.exercise_id,
        name: row.exercise.name,
        equipmentId: row.equipment_id,
        targetSets: row.target_sets,
        targetRepMin: row.target_rep_min,
        targetRepMax: row.target_rep_max,
        plannedWeight: row.planned_weight,
      })),
    });

    startDraft(draft);
    const createdSession = await startSession.mutateAsync({
      templateId: templateData.template.id,
      clientSessionKey,
    });
    attachSessionId(createdSession.id);
    router.push("/active-workout");
  };

  const resumeDraft = () => {
    router.push("/active-workout");
  };

  return (
    <ScreenShell
      title="Today's Workout"
      subtitle="Starter session built from your profile and equipment."
    >
      {isLoading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {existingDraft ? (
            <CommandCard
              title={existingDraft.templateName}
              subtitle="Active draft in progress. Resume logging before starting a new session."
              statusLabel="IN PROGRESS"
              onPress={resumeDraft}
            />
          ) : null}

          {starterTemplate.data ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>STARTER WORKOUT</Text>
              {starterTemplate.data.exercises.map((row) => (
                <View key={row.id} style={styles.exerciseRow}>
                  <Text style={styles.exerciseName}>{row.exercise.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {formatExerciseTarget(row)}
                  </Text>
                  {getProgressionReasonText(row.last_progression_reason_code) ? (
                    <Text style={styles.progressionReason}>
                      {getProgressionReasonText(row.last_progression_reason_code)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.helper}>
              No starter template yet. Start a workout to generate one from your equipment setup.
            </Text>
          )}

          <PrimaryCTAButton
            label={existingDraft ? "Resume Active Workout" : "Start Workout"}
            onPress={existingDraft ? resumeDraft : handleStartWorkout}
            disabled={ensureStarterTemplate.isPending || startSession.isPending}
          />
        </ScrollView>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text.secondary,
  },
  exerciseRow: {
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: 8,
    backgroundColor: colors.background.elevated,
    padding: spacing.md,
    gap: spacing.xs,
  },
  exerciseName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  exerciseMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  progressionReason: {
    ...typography.caption,
    color: colors.accent.success,
  },
  helper: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
