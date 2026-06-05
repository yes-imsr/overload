import { router, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { PlaceholderScreen } from "@/components/placeholder-screen";
import { PrimaryCTAButton } from "@/components";
import { useAuthSession, useSignOut } from "@/features/onboarding/queries";
import { colors, spacing, typography } from "@/tokens";

export default function ProfileRoute() {
  const session = useAuthSession();
  const signOut = useSignOut();
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setError(null);

    try {
      await signOut.mutateAsync();
      router.replace("/welcome");
    } catch {
      setError("Unable to sign out. Try again.");
    }
  };

  return (
    <PlaceholderScreen
      eyebrow="Account access"
      title="Profile terminal"
      body="Signed-in operator session. End the session to return to access control."
      navigation={[
        { label: "Home console", href: "/(app)/home" },
        { label: "Workout bay", href: "/(app)/workouts", tone: "success" },
        { label: "Credits console", href: "/(app)/economy", tone: "economy" },
      ]}
    >
      <Text style={styles.sessionLabel}>
        {session.data?.user.email ?? "Session active"}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryCTAButton
        label="Sign out"
        variant="danger"
        loading={signOut.isPending}
        onPress={handleSignOut}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/delete-account" as Href)}
        style={styles.deleteLink}
      >
        <Text style={styles.deleteLinkLabel}>Delete account</Text>
      </Pressable>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  sessionLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
    marginBottom: spacing.sm,
  },
  deleteLink: {
    alignItems: "center",
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  deleteLinkLabel: {
    ...typography.bodyMedium,
    color: colors.accent.dangerBright,
  },
});
