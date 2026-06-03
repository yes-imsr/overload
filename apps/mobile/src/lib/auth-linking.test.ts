import { describe, expect, it } from "vitest";
import {
  AUTH_CALLBACK_ROUTE,
  formatAuthCallbackError,
  getAuthCallbackFailureMessage,
  isAuthCallbackUrl,
  parseAuthCallbackUrl,
} from "./auth-linking-parse";

describe("auth-linking-parse", () => {
  it("defines a stable in-app callback route constant", () => {
    expect(AUTH_CALLBACK_ROUTE).toBe("/auth/callback");
  });

  it("recognizes overload scheme callback URLs", () => {
    expect(isAuthCallbackUrl("overload://auth/callback")).toBe(true);
    expect(isAuthCallbackUrl("exp://127.0.0.1:8081/--/auth/callback")).toBe(true);
  });

  it("parses token fragments from callback URLs", () => {
    const parsed = parseAuthCallbackUrl(
      "overload://auth/callback#access_token=abc&refresh_token=def&type=recovery",
    );

    expect(parsed.status).toBe("tokens");
    if (parsed.status === "tokens") {
      expect(parsed.params.accessToken).toBe("abc");
      expect(parsed.params.refreshToken).toBe("def");
      expect(parsed.params.type).toBe("recovery");
    }
  });

  it("parses auth codes from callback query strings", () => {
    const parsed = parseAuthCallbackUrl(
      "overload://auth/callback?code=auth-code-123&type=recovery",
    );

    expect(parsed.status).toBe("tokens");
    if (parsed.status === "tokens") {
      expect(parsed.params.authCode).toBe("auth-code-123");
    }
  });

  it("flags malformed callback URLs", () => {
    const parsed = parseAuthCallbackUrl("overload://welcome");
    expect(parsed.status).toBe("malformed");
  });

  it("returns safe callback error copy", () => {
    expect(formatAuthCallbackError("invalid_request", "Email link is invalid or has expired")).toBe(
      "This auth link is invalid or expired. Request a new link and try again.",
    );
  });

  it("detects missing callback credentials", () => {
    const parsed = parseAuthCallbackUrl("overload://auth/callback");
    expect(getAuthCallbackFailureMessage(parsed)).toBe(
      "Invalid auth callback. Request a new link and try again.",
    );
  });
});
