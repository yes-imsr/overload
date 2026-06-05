import * as WebBrowser from "expo-web-browser";
import { completeAuthCallback } from "@/lib/auth-callback";
import { createAuthRedirectUrl } from "@/lib/auth-linking";
import { signInWithGoogle, type GoogleSignInResult } from "@/lib/google-sign-in";
import { supabase } from "@/lib/supabase";

export async function signInWithGoogleFromClient(): Promise<GoogleSignInResult> {
  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured.",
    };
  }

  return signInWithGoogle({
    signInWithOAuth: (params) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }
      return supabase.auth.signInWithOAuth(params);
    },
    openAuthSession: async (url, redirectUrl) => {
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
      return {
        type: result.type,
        url: "url" in result ? result.url : undefined,
      };
    },
    completeCallback: completeAuthCallback,
    createRedirectUrl: createAuthRedirectUrl,
  });
}
