/** Custom URL scheme registered in app.json for production/dev builds. */
export const AUTH_APP_SCHEME = "overload";

/** Expo Router path segment for the auth callback screen. */
export const AUTH_CALLBACK_PATH = "auth/callback";

/** In-app route used by Expo Router for auth callbacks. */
export const AUTH_CALLBACK_ROUTE = "/auth/callback" as const;

export type AuthCallbackParams = {
  accessToken: string | null;
  refreshToken: string | null;
  authCode: string | null;
  type: string | null;
  error: string | null;
  errorDescription: string | null;
};

export type ParsedAuthCallback =
  | { status: "tokens"; params: AuthCallbackParams }
  | { status: "malformed"; message: string };

type ParsedCallbackLocation = {
  protocol: string;
  hostname: string;
  pathname: string;
};

function parseCallbackLocation(url: string): ParsedCallbackLocation | null {
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol.toLowerCase(),
      hostname: parsed.hostname.toLowerCase(),
      pathname: parsed.pathname,
    };
  } catch {
    return null;
  }
}

function isTrustedOverloadCallback(location: ParsedCallbackLocation): boolean {
  return (
    location.protocol === `${AUTH_APP_SCHEME}:` &&
    location.hostname === "auth" &&
    location.pathname === "/callback"
  );
}

function isTrustedExpoGoCallback(location: ParsedCallbackLocation): boolean {
  return location.protocol === "exp:" && location.pathname === "/--/auth/callback";
}

/** Accepts only exact trusted mobile callback URLs, not substring lookalikes. */
export function isAuthCallbackUrl(url: string): boolean {
  const location = parseCallbackLocation(url);
  if (!location) {
    return false;
  }

  return isTrustedOverloadCallback(location) || isTrustedExpoGoCallback(location);
}

function extractParamString(url: string): string {
  const hashIndex = url.indexOf("#");
  if (hashIndex >= 0) {
    return url.slice(hashIndex + 1);
  }

  const queryIndex = url.indexOf("?");
  if (queryIndex >= 0) {
    return url.slice(queryIndex + 1);
  }

  return "";
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return null;
  }
}

function parseParamString(paramString: string): Record<string, string> | null {
  if (!paramString) {
    return {};
  }

  const params: Record<string, string> = {};

  for (const part of paramString.split("&")) {
    if (!part) {
      continue;
    }

    const separatorIndex = part.indexOf("=");
    const rawKey = separatorIndex >= 0 ? part.slice(0, separatorIndex) : part;
    const rawValue = separatorIndex >= 0 ? part.slice(separatorIndex + 1) : "";

    if (!rawKey) {
      continue;
    }

    const key = safeDecodeURIComponent(rawKey);
    const value = safeDecodeURIComponent(rawValue);

    if (key === null || value === null) {
      return null;
    }

    params[key] = value;
  }

  return params;
}

/** Parses Supabase auth callback URLs from hash fragments or query strings. */
export function parseAuthCallbackUrl(url: string): ParsedAuthCallback {
  if (!isAuthCallbackUrl(url)) {
    return {
      status: "malformed",
      message: "Invalid auth callback link.",
    };
  }

  const params = parseParamString(extractParamString(url));

  if (params === null) {
    return {
      status: "malformed",
      message: "Invalid auth callback link.",
    };
  }

  return {
    status: "tokens",
    params: {
      accessToken: params.access_token ?? null,
      refreshToken: params.refresh_token ?? null,
      authCode: params.code ?? null,
      type: params.type ?? null,
      error: params.error ?? null,
      errorDescription: params.error_description ?? null,
    },
  };
}

/** Maps callback/provider errors to safe user-facing copy. */
export function formatAuthCallbackError(
  error: string | null,
  errorDescription: string | null,
): string {
  const normalized = `${error ?? ""} ${errorDescription ?? ""}`.toLowerCase();

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized.includes("otp")
  ) {
    return "This auth link is invalid or expired. Request a new link and try again.";
  }

  return "Unable to complete auth callback. Return to sign in and try again.";
}

export function getAuthCallbackFailureMessage(parsed: ParsedAuthCallback): string {
  if (parsed.status === "malformed") {
    return parsed.message;
  }

  if (parsed.params.error) {
    return formatAuthCallbackError(parsed.params.error, parsed.params.errorDescription);
  }

  const hasTokens = Boolean(parsed.params.accessToken && parsed.params.refreshToken);
  const hasCode = Boolean(parsed.params.authCode);

  if (!hasTokens && !hasCode) {
    return "Invalid auth callback. Request a new link and try again.";
  }

  return "Unable to complete auth callback. Return to sign in and try again.";
}
