import { describe, expect, it } from "vitest";
import {
  ACCOUNT_DELETION_CONFIRM_PHRASE,
  formatDeleteAccountError,
  usesEmailPasswordAuth,
  validateDeleteAccountConfirmation,
} from "./delete-account";

describe("validateDeleteAccountConfirmation", () => {
  it("accepts the exact confirmation phrase", () => {
    expect(validateDeleteAccountConfirmation(ACCOUNT_DELETION_CONFIRM_PHRASE)).toBeNull();
  });

  it("rejects blank or partial phrases", () => {
    expect(validateDeleteAccountConfirmation("")).toMatch(/DELETE/);
    expect(validateDeleteAccountConfirmation("delete")).toMatch(/DELETE/);
    expect(validateDeleteAccountConfirmation("DELETE ")).toMatch(/DELETE/);
  });
});

describe("usesEmailPasswordAuth", () => {
  it("detects email-password identities", () => {
    expect(usesEmailPasswordAuth([{ provider: "google" }])).toBe(false);
    expect(usesEmailPasswordAuth([{ provider: "email" }])).toBe(true);
  });
});

describe("formatDeleteAccountError", () => {
  it("maps auth and validation failures to safe copy", () => {
    expect(formatDeleteAccountError(new Error("Invalid login credentials"))).toMatch(
      /password/i,
    );
    expect(formatDeleteAccountError(new Error("Invalid confirmation phrase"))).toMatch(
      /confirmation phrase/i,
    );
    expect(formatDeleteAccountError(new Error("Unauthorized"))).toMatch(/session expired/i);
  });
});
