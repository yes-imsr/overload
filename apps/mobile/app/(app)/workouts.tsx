import { Pressable, StyleSheet, Text, View } from "react-native";
import { PlaceholderScreen } from "@/components/placeholder-screen";
import { useActiveWorkoutDraftStore } from "@/state/active-workout-draft-store";
import { colors, radius, spacing, typography } from "@/tokens";

export default function WorkoutsRoute() {
  const draft = useActiveWorkoutDraftStore((state) => state.draft);
  const setDraft = useActiveWorkoutDraftStore((state) => state.setDraft);
  const clearDraft = useActiveWorkoutDraftStore((state) => state.clearDraft);

  return (
    <PlaceholderScreen
      eyebrow="Workout logging"
      title="Workout bay"
      body="Placeholder route for active workout logging. Local Zustand state is limited to an in-progress draft; completed sessions and game outcomes remain server-owned."
      navigation={[
        { label: "Home console", href: "/(app)/home" },
        { label: "Credits console", href: "/(app)/economy", tone: "economy" },
        { label: "Profile", href: "/(app)/profile" },
        { label: "Welcome", href: "/welcome" },
      ]}
    >
      <View style={styles.draftPanel}>
        <Text style={styles.draftLabel}>Active draft boundary</Text>
        <Text style={styles.draftValue}>
          {draft ? draft.movementName || "Unnamed movement" : "No local draft"}
        </Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={styles.actionButton}
            onPress={() =>
              setDraft({
                movementName: "Draft movement",
                loadText: "",
                repsText: "",
                notes: "Local draft only",
              })
            }
          >
            <Text style={styles.actionText}>Create draft</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.actionButton, styles.clearButton]}
            onPress={clearDraft}
          >
            <Text style={styles.actionText}>Clear draft</Text>
          </Pressable>
        </View>
      </View>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  draftPanel: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: radius.sm,
    backgroundColor: colors.background.primary,
    padding: spacing.md,
  },
  draftLabel: {
    ...typography.label,
    color: colors.text.muted,
  },
  draftValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.accent.success,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    borderColor: colors.accent.danger,
  },
  actionText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
});
