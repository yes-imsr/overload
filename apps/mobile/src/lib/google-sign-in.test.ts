import { describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { formatGoogleSignInError } from "./auth-errors";
import { mapOAuthBrowserResult, signInWithGoogle } from "./google-sign-in";

describe("formatGoogleSignInError", () => {
  it("maps disabled provider errors to unavailable copy", () => {
    expect(formatGoogleSignInError(new Error("Provider google is not enabled"))).toBe(
      "Google sign-in is unavailable right now.",
    );
  });

  it("falls back to generic Google sign-in copy", () => {
    expect(formatGoogleSignInError(new Error("network timeout"))).toBe(
      "Unable to sign in with Google. Try again or use email.",
    );
  });
});

describe("mapOAuthBrowserResult", () => {
  it("treats cancel and dismiss as cancelled", () => {
    expect(mapOAuthBrowserResult({ type: "cancel", url: undefined })).toEqual({
      status: "cancelled",
    });
    expect(mapOAuthBrowserResult({ type: "dismiss", url: undefined })).toEqual({
      status: "cancelled",
    });
  });

  it("returns callback url on success", () => {
    expect(
      mapOAuthBrowserResult({
        type: "success",
        url: "overload://auth/callback?code=abc",
      }),
    ).toEqual({
      status: "callback",
      url: "overload://auth/callback?code=abc",
    });
  });
});

describe("signInWithGoogle", () => {
  it("returns provider unavailable when OAuth bootstrap fails", async () => {
    const result = await signInWithGoogle({
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { provider: "google", url: null },
        error: new Error("Provider google is not enabled"),
      }),
      openAuthSession: vi.fn(),
      completeCallback: vi.fn(),
      createRedirectUrl: () => "overload://auth/callback",
    });

    expect(result).toEqual({
      status: "error",
      message: "Google sign-in is unavailable right now.",
    });
  });

  it("returns cancelled when the provider sheet is dismissed", async () => {
    const result = await signInWithGoogle({
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { provider: "google", url: "https://accounts.google.com/o/oauth2/auth" },
        error: null,
      }),
      openAuthSession: vi.fn().mockResolvedValue({ type: "cancel", url: undefined }),
      completeCallback: vi.fn(),
      createRedirectUrl: () => "overload://auth/callback",
    });

    expect(result).toEqual({ status: "cancelled" });
  });

  it("completes sign-in from callback url", async () => {
    const session = { user: { id: "user-1" } } as Session;

    const result = await signInWithGoogle({
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { provider: "google", url: "https://accounts.google.com/o/oauth2/auth" },
        error: null,
      }),
      openAuthSession: vi.fn().mockResolvedValue({
        type: "success",
        url: "overload://auth/callback?code=abc",
      }),
      completeCallback: vi.fn().mockResolvedValue({
        status: "success",
        session,
        type: null,
      }),
      createRedirectUrl: () => "overload://auth/callback",
    });

    expect(result).toEqual({
      status: "success",
      session,
    });
  });
});
