export const ACCOUNT_DELETION_CONFIRM_PHRASE = "DELETE";

export const ACCOUNT_DELETION_WARNING =
  "This permanently deletes your operator account, workouts, calibration, economy progress, and all game state. This cannot be undone.";

export type DeleteAccountRequestBody = {
  confirmDeletion: true;
  confirmationPhrase: string;
};

export function validateDeleteAccountConfirmation(phrase: string): string | null {
  if (phrase !== ACCOUNT_DELETION_CONFIRM_PHRASE) {
    return `Type ${ACCOUNT_DELETION_CONFIRM_PHRASE} to confirm permanent deletion.`;
  }

  return null;
}

export function usesEmailPasswordAuth(
  identities: { provider: string }[] | undefined,
): boolean {
  return identities?.some((identity) => identity.provider === "email") ?? false;
}

function normalizeMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}

export function formatDeleteAccountError(error: unknown): string {
  const normalized = normalizeMessage(error).toLowerCase();

  if (normalized.includes("invalid login credentials") || normalized.includes("wrong password")) {
    return "Password is incorrect. Re-enter your password to delete this account.";
  }

  if (normalized.includes("invalid confirmation phrase")) {
    return "Confirmation phrase is incorrect.";
  }

  if (normalized.includes("unauthorized") || normalized.includes("missing authorization")) {
    return "Session expired. Sign in again, then retry account deletion.";
  }

  return "Unable to delete account. Try again.";
}
