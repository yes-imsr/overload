import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { PrimaryCTAButton } from "@/components";
import { FormField } from "@/components/FormField";
import { OnboardingShell } from "@/components/OnboardingShell";
import {
  PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE,
  validateEmailAddress,
} from "@/lib/auth-errors";
import { createAuthRedirectUrl } from "@/lib/auth-linking";
import { supabase } from "@/lib/supabase";
import { colors, spacing, typography } from "@/tokens";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    const validationError = validateEmailAddress(email);
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: createAuthRedirectUrl() },
      );

      if (resetError) {
        throw resetError;
      }
    } catch {
      // Intentionally non-leaky: same copy whether or not the email exists.
    }

    setSuccess(PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE);
    setLoading(false);
  };

  return (
    <OnboardingShell
      eyebrow="Access control"
      title="Reset operator credentials"
      body="Enter the email tied to your account. If a matching account exists, a reset link will be sent."
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
          <PrimaryCTAButton label="Send reset link" loading={loading} onPress={submit} />
          <Pressable onPress={() => router.replace("/sign-in")} style={styles.linkButton}>
            <Text style={styles.linkLabel}>Return to sign in</Text>
          </Pressable>
        </>
      }
    >
      <FormField
        label="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
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
