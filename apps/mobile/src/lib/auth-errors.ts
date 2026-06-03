export type AuthMode = "sign_in" | "sign_up";

export const PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE =
  "If an account exists for this email, a reset link has been sent.";

export const PASSWORD_UPDATE_SUCCESS_MESSAGE = "Password updated. Restoring session...";

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

export function validateEmailAddress(email: string): string | null {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return "Enter your email address.";
  }

  if (!trimmedEmail.includes("@")) {
    return "Enter a valid email address.";
  }

  return null;
}

export function validatePasswordUpdate(
  password: string,
  confirmPassword: string,
): string | null {
  if (!password) {
    return "Enter a new password.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

/** Always returns the same success copy regardless of whether the email exists. */
export function formatPasswordResetRequestError(_error: unknown): string {
  return PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE;
}

export function formatPasswordUpdateError(error: unknown): string {
  const normalized = normalizeMessage(error).toLowerCase();

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized.includes("session")
  ) {
    return "This reset link is invalid or expired. Request a new link and try again.";
  }

  if (
    normalized.includes("password") &&
    (normalized.includes("weak") ||
      normalized.includes("short") ||
      normalized.includes("at least"))
  ) {
    return "Use a stronger password (minimum 6 characters).";
  }

  return "Unable to update password. Try again or request a new reset link.";
}
