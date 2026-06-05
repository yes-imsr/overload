export const ACCOUNT_DELETION_CONFIRM_PHRASE = "DELETE";

export type DeleteAccountRequest = {
  confirmDeletion: true;
  confirmationPhrase: string;
};

export function parseDeleteAccountRequest(
  body: unknown,
): { ok: true; request: DeleteAccountRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const record = body as Record<string, unknown>;

  if (record.confirmDeletion !== true) {
    return { ok: false, error: "confirmDeletion must be true" };
  }

  if (record.confirmationPhrase !== ACCOUNT_DELETION_CONFIRM_PHRASE) {
    return { ok: false, error: "Invalid confirmation phrase" };
  }

  return {
    ok: true,
    request: {
      confirmDeletion: true,
      confirmationPhrase: ACCOUNT_DELETION_CONFIRM_PHRASE,
    },
  };
}
