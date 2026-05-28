import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { CalibrationBadge } from "@/components";
import { useAuthSession } from "@/features/onboarding/queries";
import { useExerciseCalibrations } from "@/features/calibration/queries";
import { toCalibrationUiLabel } from "@overload/core-engine";
import { ScreenShell } from "@/screens/ScreenShell";
import { colors, spacing, typography } from "@/tokens";

export default function CalibrationScreen() {
  const session = useAuthSession();
  const userId = session.data?.user.id;
  const calibrations = useExerciseCalibrations(userId);

  return (
    <ScreenShell
      title="Calibration Status"
      subtitle="Persisted exercise confidence from completed sessions."
    >
      {calibrations.isLoading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : calibrations.data && calibrations.data.length > 0 ? (
        <ScrollView contentContainerStyle={styles.list}>
          {calibrations.data.map((row) => (
            <View key={row.id} style={styles.row}>
              <View style={styles.copy}>
                <Text style={styles.exerciseName}>{row.exercise.name}</Text>
                <Text style={styles.statusLabel}>
                  {toCalibrationUiLabel(row.calibration_status)}
                </Text>
              </View>
              <CalibrationBadge status={row.calibration_status} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.empty}>
          No calibration records yet. Complete a workout to start learning your lifts.
        </Text>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  row: {
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: 8,
    backgroundColor: colors.background.elevated,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  exerciseName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  statusLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  empty: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
