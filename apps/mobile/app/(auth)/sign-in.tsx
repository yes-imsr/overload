import { Href, router } from "expo-router";
import { useEffect, useState } from "react";
import { useOnboardingRedirect } from "@/hooks/use-onboarding-redirect";
import type { Session } from "@supabase/supabase-js";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { PrimaryCTAButton } from "@/components";
import { FormField } from "@/components/FormField";
import { OnboardingShell } from "@/components/OnboardingShell";
import { SessionRestoreNotice } from "@/components/SessionRestoreNotice";
import { authSessionQueryKey } from "@/features/onboarding/queries";
import {
  formatAuthError,
  validateAuthCredentials,
} from "@/lib/auth-errors";
import { resolveAuthenticatedRoute } from "@/lib/auth-session";
import { signInWithGoogleFromClient } from "@/lib/google-sign-in-client";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { colors, spacing, typography } from "@/tokens";

type Mode = "sign_in" | "sign_up";

export default function SignInScreen() {
  const route = useOnboardingRedirect();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (route && route !== "/welcome" && route !== "/sign-in") {
      router.replace(route);
    }
  }, [route]);
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigateAfterSession = async (session: Session) => {
    queryClient.setQueryData(authSessionQueryKey, session);

    const nextRoute = await resolveAuthenticatedRoute(session);
    if (nextRoute.status === "error") {
      setError(nextRoute.message);
      return;
    }

    router.replace(nextRoute.route);
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setGoogleLoading(true);
    setError(null);

    try {
      const result = await signInWithGoogleFromClient();

      if (result.status === "cancelled") {
        return;
      }

      if (result.status === "error") {
        setError(result.message);
        return;
      }

      await navigateAfterSession(result.session);
    } finally {
      setGoogleLoading(false);
    }
  };

  const submit = async () => {
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    const validationError = validateAuthCredentials(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const credentials = { email: email.trim(), password };

      const result =
        mode === "sign_up"
          ? await supabase.auth.signUp(credentials)
          : await supabase.auth.signInWithPassword(credentials);

      if (result.error) {
        throw result.error;
      }

      const session = result.data.session;
      if (!session) {
        setError("Check your email to confirm the account, then sign in.");
        return;
      }

      queryClient.setQueryData(authSessionQueryKey, session);

      await navigateAfterSession(session);
    } catch (caught) {
      setError(formatAuthError(mode, caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingShell
      eyebrow="Access control"
      title={mode === "sign_in" ? "Restore operator session" : "Create operator ID"}
      body="Use email credentials or Google account access. No contact import, wearables, or nutrition setup in MVP."
      footer={
        <>
          <SessionRestoreNotice />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryCTAButton
            label="Sign in with Google"
            loading={googleLoading}
            disabled={loading || !isSupabaseConfigured()}
            onPress={handleGoogleSignIn}
          />
          <Text style={styles.dividerLabel}>Or use email</Text>
          <PrimaryCTAButton
            label={mode === "sign_in" ? "Sign in" : "Create account"}
            loading={loading}
            disabled={googleLoading}
            onPress={submit}
          />
        </>
      }
    >
      <View style={styles.modeRow}>
        <Pressable onPress={() => setMode("sign_in")} style={styles.modeButton}>
          <Text
            style={[
              styles.modeLabel,
              mode === "sign_in" && styles.modeLabelActive,
            ]}
          >
            Sign in
          </Text>
        </Pressable>
        <Pressable onPress={() => setMode("sign_up")} style={styles.modeButton}>
          <Text
            style={[
              styles.modeLabel,
              mode === "sign_up" && styles.modeLabelActive,
            ]}
          >
            Sign up
          </Text>
        </Pressable>
      </View>

      <FormField
        label="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <FormField
        label="Password"
        secureTextEntry
        autoComplete={mode === "sign_up" ? "new-password" : "password"}
        value={password}
        onChangeText={setPassword}
      />
      {mode === "sign_in" ? (
        <Pressable onPress={() => router.push("/forgot-password" as Href)} style={styles.linkButton}>
          <Text style={styles.linkLabel}>Forgot password?</Text>
        </Pressable>
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  modeButton: {
    paddingVertical: spacing.xs,
  },
  modeLabel: {
    ...typography.bodyMedium,
    color: colors.text.muted,
  },
  modeLabelActive: {
    color: colors.text.primary,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
  },
  linkLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  dividerLabel: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: "center",
  },
});
