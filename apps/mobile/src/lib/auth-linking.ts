import * as Linking from "expo-linking";
import { AUTH_CALLBACK_PATH } from "@/lib/auth-linking-parse";

export {
  AUTH_APP_SCHEME,
  AUTH_CALLBACK_PATH,
  AUTH_CALLBACK_ROUTE,
  formatAuthCallbackError,
  getAuthCallbackFailureMessage,
  isAuthCallbackUrl,
  parseAuthCallbackUrl,
  type AuthCallbackParams,
  type ParsedAuthCallback,
} from "@/lib/auth-linking-parse";

/** Builds the redirect URL Supabase should send users back to after auth actions. */
export function createAuthRedirectUrl(): string {
  return Linking.createURL(AUTH_CALLBACK_PATH);
}
