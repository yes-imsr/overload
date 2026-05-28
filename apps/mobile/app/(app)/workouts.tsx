import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryCTAButton } from "@/components";
import { CommandCard } from "@/components/CommandCard";
import { useActiveWorkoutDraftStore } from "@/state/active-workout-draft-store";
import { colors, spacing, typography } from "@/tokens";

export default function WorkoutsRoute() {
  const draft = useActiveWorkoutDraftStore((state) => state.draft);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>WORKOUT LOGGING</Text>
      <Text style={styles.title}>Workout bay</Text>
      <Text style={styles.body}>
        Start a starter session, log sets locally, and complete through the server-owned
        completion path.
      </Text>

      {draft ? (
        <CommandCard
          title={draft.templateName}
          subtitle="Active draft in progress."
          statusLabel="IN PROGRESS"
          onPress={() => router.push("/active-workout")}
        />
      ) : null}

      <PrimaryCTAButton
        label={draft ? "Resume Active Workout" : "Open Today's Workout"}
        onPress={() => router.push(draft ? "/active-workout" : "/todays-workout")}
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
});
