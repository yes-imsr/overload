import type { Session } from "@supabase/supabase-js";
import { resolveOnboardingRoute, type OnboardingRoute } from "@/features/onboarding/onboarding-routes";
import { supabase } from "@/lib/supabase";

export type AuthenticatedRouteResult =
  | { status: "success"; route: OnboardingRoute }
  | { status: "error"; message: string };

/** Loads the operator profile and resolves the next onboarding/app route. */
export async function resolveAuthenticatedRoute(
  session: Session,
): Promise<AuthenticatedRouteResult> {
  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_status")
    .eq("id", session.user.id)
    .single();

  if (profileError) {
    return {
      status: "error",
      message: "Signed in, but profile state is unavailable. Try again.",
    };
  }

  const route = resolveOnboardingRoute({
    hasSession: true,
    onboardingStatus: profile.onboarding_status,
    isLoading: false,
  });

  return {
    status: "success",
    route: route ?? "/welcome",
  };
}
