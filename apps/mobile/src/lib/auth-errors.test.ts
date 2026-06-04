import { describe, expect, it } from "vitest";
import {
  formatAuthError,
  formatPasswordResetRequestError,
  PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE,
  validateAuthCredentials,
  validatePasswordUpdate,
} from "./auth-errors";

describe("formatAuthError", () => {
  it("uses a generic message for invalid login credentials", () => {
    expect(formatAuthError("sign_in", new Error("Invalid login credentials"))).toBe(
      "Email or password is incorrect.",
    );
  });

  it("does not reveal whether an email is already registered", () => {
    expect(formatAuthError("sign_up", new Error("User already registered"))).toBe(
      "Unable to create account with these credentials.",
    );
  });

  it("falls back to mode-specific generic copy", () => {
    expect(formatAuthError("sign_in", new Error("unexpected upstream failure"))).toBe(
      "Unable to sign in. Check your credentials and try again.",
    );
  });
});

describe("validateAuthCredentials", () => {
  it("requires email and password", () => {
    expect(validateAuthCredentials("", "")).toBe("Enter your email address.");
    expect(validateAuthCredentials("user@example.com", "")).toBe("Enter your password.");
  });

  it("enforces minimum password length", () => {
    expect(validateAuthCredentials("user@example.com", "12345")).toBe(
      "Password must be at least 6 characters.",
    );
  });
});

describe("password reset helpers", () => {
  it("uses non-enumerating reset request copy", () => {
    expect(formatPasswordResetRequestError(new Error("User not found"))).toBe(
      PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE,
    );
  });

  it("validates password confirmation", () => {
    expect(validatePasswordUpdate("secret123", "different")).toBe("Passwords do not match.");
  });
});
