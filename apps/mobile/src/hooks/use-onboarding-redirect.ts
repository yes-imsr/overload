import {
  isOnboardingComplete,
  resolveOnboardingRoute,
  type OnboardingRoute,
} from "@/features/onboarding/onboarding-routes";
import { useAuthSession, useProfile } from "@/features/onboarding/queries";
import { isSupabaseConfigured } from "@/lib/supabase";

type Options = {
  /** When true, incomplete onboarding returns a redirect target instead of null. */
  guardApp?: boolean;
};

export function useOnboardingRedirect(options: Options = {}): OnboardingRoute | null {
  const { guardApp = false } = options;
  const sessionQuery = useAuthSession();
  const userId = sessionQuery.data?.user.id;
  const profileQuery = useProfile(userId);

  const isLoading =
    sessionQuery.isLoading || (Boolean(userId) && profileQuery.isLoading);

  if (isLoading) {
    return null;
  }

  if (!isSupabaseConfigured()) {
    return "/welcome";
  }

  const route = resolveOnboardingRoute({
    hasSession: Boolean(sessionQuery.data),
    onboardingStatus: profileQuery.data?.onboarding_status ?? null,
    isLoading: false,
  });

  if (guardApp) {
    if (isOnboardingComplete(profileQuery.data?.onboarding_status)) {
      return null;
    }
    return route === "/home" ? "/training-profile" : route;
  }

  return route;
}
