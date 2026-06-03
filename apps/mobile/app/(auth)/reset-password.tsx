import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { PrimaryCTAButton } from "@/components";
import { FormField } from "@/components/FormField";
import { OnboardingShell } from "@/components/OnboardingShell";
import { resolveOnboardingRoute } from "@/features/onboarding/onboarding-routes";
import { authSessionQueryKey, useAuthSession } from "@/features/onboarding/queries";
import {
  formatPasswordUpdateError,
  PASSWORD_UPDATE_SUCCESS_MESSAGE,
  validatePasswordUpdate,
} from "@/lib/auth-errors";
import { supabase } from "@/lib/supabase";
import { colors, spacing, typography } from "@/tokens";

export default function ResetPasswordScreen() {
  const sessionQuery = useAuthSession();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionQuery.isLoading) {
      return;
    }

    if (!sessionQuery.data) {
      router.replace("/sign-in");
    }
  }, [sessionQuery.data, sessionQuery.isLoading]);

  const submit = async () => {
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    const validationError = validatePasswordUpdate(password, confirmPassword);
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      if (data.user) {
        const { data: sessionData } = await supabase.auth.getSession();
        queryClient.setQueryData(authSessionQueryKey, sessionData.session ?? null);
      }

      setSuccess(PASSWORD_UPDATE_SUCCESS_MESSAGE);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_status")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        router.replace("/sign-in");
        return;
      }

      const next = resolveOnboardingRoute({
        hasSession: true,
        onboardingStatus: profile.onboarding_status,
        isLoading: false,
      });

      router.replace(next ?? "/sign-in");
    } catch (caught) {
      setError(formatPasswordUpdateError(caught));
    } finally {
      setLoading(false);
    }
  };

  if (sessionQuery.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text.primary} />
      </View>
    );
  }

  if (!sessionQuery.data) {
    return null;
  }

  return (
    <OnboardingShell
      eyebrow="Access control"
      title="Set new password"
      body="Choose a new password for your operator account."
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
          <PrimaryCTAButton label="Update password" loading={loading} onPress={submit} />
          <Pressable onPress={() => router.replace("/sign-in")} style={styles.linkButton}>
            <Text style={styles.linkLabel}>Return to sign in</Text>
          </Pressable>
        </>
      }
    >
      <FormField
        label="New password"
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
      />
      <FormField
        label="Confirm password"
        secureTextEntry
        autoComplete="new-password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.primary,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
  success: {
    ...typography.caption,
    color: colors.accent.success,
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
