import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { PrimaryCTAButton } from "@/components";
import { FormField } from "@/components/FormField";
import { useDeleteAccount } from "@/features/account/queries";
import { useAuthSession, useSignOut } from "@/features/onboarding/queries";
import {
  ACCOUNT_DELETION_CONFIRM_PHRASE,
  ACCOUNT_DELETION_WARNING,
  formatDeleteAccountError,
  usesEmailPasswordAuth,
  validateDeleteAccountConfirmation,
} from "@/lib/delete-account";
import { supabase } from "@/lib/supabase";
import { ScreenShell } from "@/screens/ScreenShell";
import { colors, spacing, typography } from "@/tokens";

export default function DeleteAccountRoute() {
  const sessionQuery = useAuthSession();
  const deleteAccount = useDeleteAccount();
  const signOut = useSignOut();
  const [confirmationPhrase, setConfirmationPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const session = sessionQuery.data;
  const requiresPassword = useMemo(
    () => usesEmailPasswordAuth(session?.user.identities),
    [session?.user.identities],
  );

  const phraseError = validateDeleteAccountConfirmation(confirmationPhrase);
  const canSubmit =
    !phraseError &&
    (!requiresPassword || password.length > 0) &&
    !deleteAccount.isPending &&
    !signOut.isPending;

  const submit = async () => {
    if (!supabase || !session?.user.email) {
      setError("Supabase is not configured.");
      return;
    }

    const validationError = validateDeleteAccountConfirmation(confirmationPhrase);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (requiresPassword && !password) {
      setError("Enter your password to confirm account deletion.");
      return;
    }

    setError(null);

    try {
      if (requiresPassword) {
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: session.user.email,
          password,
        });

        if (reauthError) {
          throw reauthError;
        }
      }

      await deleteAccount.mutateAsync({
        confirmDeletion: true,
        confirmationPhrase: ACCOUNT_DELETION_CONFIRM_PHRASE,
      });

      await signOut.mutateAsync();
      router.replace("/welcome");
    } catch (caught) {
      setError(formatDeleteAccountError(caught));
    }
  };

  if (sessionQuery.isLoading) {
    return (
      <ScreenShell title="Delete account">
        <ActivityIndicator color={colors.text.primary} />
      </ScreenShell>
    );
  }

  if (!session) {
    router.replace("/sign-in");
    return null;
  }

  return (
    <ScreenShell
      title="Delete account"
      subtitle="Permanent operator record purge. This action cannot be reversed."
    >
      <Text style={styles.warning}>{ACCOUNT_DELETION_WARNING}</Text>
      <FormField
        label={`Type ${ACCOUNT_DELETION_CONFIRM_PHRASE} to confirm`}
        autoCapitalize="characters"
        autoCorrect={false}
        value={confirmationPhrase}
        onChangeText={setConfirmationPhrase}
      />
      {requiresPassword ? (
        <FormField
          label="Password"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryCTAButton
        label="Delete my account permanently"
        variant="danger"
        loading={deleteAccount.isPending || signOut.isPending}
        disabled={!canSubmit}
        onPress={submit}
      />
      <Pressable onPress={() => router.back()} style={styles.linkButton}>
        <Text style={styles.linkLabel}>Cancel and return to profile</Text>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  warning: {
    ...typography.body,
    color: colors.accent.dangerBright,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  linkLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
});
