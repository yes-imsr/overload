import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryCTAButton } from "@/components";
import { useOnboardingRedirectState } from "@/hooks/use-onboarding-redirect";
import { useSignOut } from "@/features/onboarding/queries";
import { colors, spacing, typography } from "@/tokens";

/** Surfaces recoverable session restore failures on signed-out auth screens. */
export function SessionRestoreNotice() {
  const { sessionRestoreError } = useOnboardingRedirectState();
  const signOut = useSignOut();

  if (!sessionRestoreError) {
    return null;
  }

  const clearSession = async () => {
    try {
      await signOut.mutateAsync();
    } catch {
      // Local query cache is cleared in onSuccess; continue to sign-in either way.
    }

    router.replace("/sign-in");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.error}>{sessionRestoreError}</Text>
      <PrimaryCTAButton
        label="Clear session and sign in"
        loading={signOut.isPending}
        onPress={clearSession}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
});
