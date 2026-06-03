import type { Session } from "@supabase/supabase-js";
import { formatGoogleSignInError } from "@/lib/auth-errors";
import type { AuthCallbackResult } from "@/lib/auth-callback";

export type GoogleSignInResult =
  | { status: "success"; session: Session }
  | { status: "cancelled" }
  | { status: "error"; message: string };

export type OAuthBrowserResult = {
  type: string;
  url?: string;
};

export type OAuthBrowserOutcome =
  | { status: "cancelled" }
  | { status: "callback"; url: string }
  | { status: "error"; message: string };

export function mapOAuthBrowserResult(result: OAuthBrowserResult): OAuthBrowserOutcome {
  if (result.type === "cancel" || result.type === "dismiss") {
    return { status: "cancelled" };
  }

  if (result.type === "success" && result.url) {
    return { status: "callback", url: result.url };
  }

  return {
    status: "error",
    message: "Google sign-in did not complete. Try again.",
  };
}

export type GoogleOAuthDependencies = {
  signInWithOAuth: (params: {
    provider: "google";
    options: { redirectTo: string; skipBrowserRedirect: boolean };
  }) => Promise<{
    data: { provider: string; url: string | null };
    error: Error | null;
  }>;
  openAuthSession: (url: string, redirectUrl: string) => Promise<OAuthBrowserResult>;
  completeCallback: (url: string) => Promise<AuthCallbackResult>;
  createRedirectUrl: () => string;
};

export async function signInWithGoogle(
  dependencies: GoogleOAuthDependencies,
): Promise<GoogleSignInResult> {
  const redirectTo = dependencies.createRedirectUrl();

  const { data, error } = await dependencies.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return {
      status: "error",
      message: formatGoogleSignInError(error ?? "Google sign-in unavailable."),
    };
  }

  const browserResult = await dependencies.openAuthSession(data.url, redirectTo);
  const browserOutcome = mapOAuthBrowserResult(browserResult);

  if (browserOutcome.status === "cancelled") {
    return { status: "cancelled" };
  }

  if (browserOutcome.status === "error") {
    return { status: "error", message: browserOutcome.message };
  }

  const callbackResult = await dependencies.completeCallback(browserOutcome.url);

  if (callbackResult.status === "error") {
    return { status: "error", message: callbackResult.message };
  }

  return {
    status: "success",
    session: callbackResult.session,
  };
}
