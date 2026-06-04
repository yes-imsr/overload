import type { Session } from "@supabase/supabase-js";
import {
  getAuthCallbackFailureMessage,
  parseAuthCallbackUrl,
  type ParsedAuthCallback,
} from "@/lib/auth-linking-parse";
import { supabase } from "@/lib/supabase";

export type AuthCallbackSuccess = {
  status: "success";
  session: Session;
  type: string | null;
};

export type AuthCallbackFailure = {
  status: "error";
  message: string;
};

export type AuthCallbackResult = AuthCallbackSuccess | AuthCallbackFailure;

export async function completeAuthCallback(url: string): Promise<AuthCallbackResult> {
  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured.",
    };
  }

  const parsed = parseAuthCallbackUrl(url);
  const failureMessage = getAuthCallbackFailureMessage(parsed);

  if (parsed.status === "malformed") {
    return { status: "error", message: failureMessage };
  }

  if (parsed.params.error) {
    return { status: "error", message: failureMessage };
  }

  const sessionResult = await restoreSessionFromCallback(parsed);

  if (sessionResult.status === "error") {
    return sessionResult;
  }

  return {
    status: "success",
    session: sessionResult.session,
    type: parsed.params.type,
  };
}

async function restoreSessionFromCallback(
  parsed: Extract<ParsedAuthCallback, { status: "tokens" }>,
): Promise<AuthCallbackSuccess | AuthCallbackFailure> {
  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured.",
    };
  }

  if (parsed.params.authCode) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(parsed.params.authCode);

    if (error || !data.session) {
      return {
        status: "error",
        message: getAuthCallbackFailureMessage(parsed),
      };
    }

    return {
      status: "success",
      session: data.session,
      type: parsed.params.type,
    };
  }

  if (!parsed.params.accessToken || !parsed.params.refreshToken) {
    return {
      status: "error",
      message: getAuthCallbackFailureMessage(parsed),
    };
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: parsed.params.accessToken,
    refresh_token: parsed.params.refreshToken,
  });

  if (error || !data.session) {
    return {
      status: "error",
      message: getAuthCallbackFailureMessage(parsed),
    };
  }

  return {
    status: "success",
    session: data.session,
    type: parsed.params.type,
  };
}
