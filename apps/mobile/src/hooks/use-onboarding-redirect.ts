import {
  APP_HOME_ROUTE,
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

export type OnboardingRedirectState = {
  redirect: OnboardingRoute | null;
  isLoading: boolean;
};

export function useOnboardingRedirectState(
  options: Options = {},
): OnboardingRedirectState {
  const { guardApp = false } = options;
  const sessionQuery = useAuthSession();
  const userId = sessionQuery.data?.user.id;
  const profileQuery = useProfile(userId);

  const isLoading =
    sessionQuery.isLoading || (Boolean(userId) && profileQuery.isLoading);

  if (isLoading) {
    return { redirect: null, isLoading: true };
  }

  if (!isSupabaseConfigured()) {
    return { redirect: "/welcome", isLoading: false };
  }

  const route = resolveOnboardingRoute({
    hasSession: Boolean(sessionQuery.data),
    onboardingStatus: profileQuery.data?.onboarding_status ?? null,
    isLoading: false,
  });

  if (guardApp) {
    if (isOnboardingComplete(profileQuery.data?.onboarding_status)) {
      return { redirect: null, isLoading: false };
    }
    return {
      redirect: route === APP_HOME_ROUTE ? "/training-profile" : route,
      isLoading: false,
    };
  }

  return { redirect: route, isLoading: false };
}

export function useOnboardingRedirect(options: Options = {}): OnboardingRoute | null {
  return useOnboardingRedirectState(options).redirect;
}
