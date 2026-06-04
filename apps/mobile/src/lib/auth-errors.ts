export type AuthMode = "sign_in" | "sign_up";

function normalizeMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}

/** Maps Supabase auth failures to user-safe copy that does not reveal account existence. */
export function formatAuthError(mode: AuthMode, error: unknown): string {
  const normalized = normalizeMessage(error).toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password") ||
    normalized.includes("wrong password")
  ) {
    return "Email or password is incorrect.";
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("already exists")
  ) {
    return "Unable to create account with these credentials.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirm your email, then sign in.";
  }

  if (
    normalized.includes("password") &&
    (normalized.includes("weak") ||
      normalized.includes("short") ||
      normalized.includes("at least"))
  ) {
    return "Use a stronger password (minimum 6 characters).";
  }

  if (normalized.includes("valid email")) {
    return "Enter a valid email address.";
  }

  return mode === "sign_up"
    ? "Unable to create account. Check your credentials and try again."
    : "Unable to sign in. Check your credentials and try again.";
}

export function validateAuthCredentials(
  email: string,
  password: string,
): string | null {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return "Enter your email address.";
  }

  if (!password) {
    return "Enter your password.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  return null;
}
