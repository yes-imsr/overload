import * as Linking from "expo-linking";
import { Href, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { PrimaryCTAButton } from "@/components";
import { OnboardingShell } from "@/components/OnboardingShell";
import { resolveOnboardingRoute } from "@/features/onboarding/onboarding-routes";
import { authSessionQueryKey } from "@/features/onboarding/queries";
import { completeAuthCallback } from "@/lib/auth-callback";
import { isAuthCallbackUrl } from "@/lib/auth-linking";
import { supabase } from "@/lib/supabase";
import { colors, typography } from "@/tokens";

type CallbackState = "loading" | "error";

export default function AuthCallbackScreen() {
  const incomingUrl = Linking.useURL();
  const queryClient = useQueryClient();
  const [state, setState] = useState<CallbackState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        const callbackUrl = incomingUrl ?? (await Linking.getInitialURL());

        if (!callbackUrl || !isAuthCallbackUrl(callbackUrl)) {
          if (!cancelled) {
            setError("Invalid auth callback link.");
            setState("error");
          }
          return;
        }

        const result = await completeAuthCallback(callbackUrl);

        if (cancelled) {
          return;
        }

        if (result.status === "error") {
          setError(result.message);
          setState("error");
          return;
        }

        queryClient.setQueryData(authSessionQueryKey, result.session);

        if (result.type === "recovery") {
          router.replace("/reset-password" as Href);
          return;
        }

        if (!supabase) {
          setError("Supabase is not configured.");
          setState("error");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("onboarding_status")
          .eq("id", result.session.user.id)
          .single();

        if (profileError) {
          setError("Session restored, but profile state is unavailable. Sign in again.");
          setState("error");
          return;
        }

        const next = resolveOnboardingRoute({
          hasSession: true,
          onboardingStatus: profile.onboarding_status,
          isLoading: false,
        });

        router.replace(next ?? "/welcome");
      } catch {
        if (!cancelled) {
          setError("Invalid auth callback link.");
          setState("error");
        }
      }
    }

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [incomingUrl, queryClient]);

  if (state === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text.primary} />
        <Text style={styles.loadingCopy}>Restoring auth callback...</Text>
      </View>
    );
  }

  return (
    <OnboardingShell
      eyebrow="Access control"
      title="Auth callback failed"
      body="The link could not restore your session. Request a new link or return to sign in."
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryCTAButton label="Return to sign in" onPress={() => router.replace("/sign-in")} />
        </>
      }
    >
      <></>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.background.primary,
    padding: 24,
  },
  loadingCopy: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
});
