import type { OnboardingStatus } from "@/types/database";

export const APP_HOME_ROUTE = "/(app)/home" as const;

export type OnboardingRoute =
  | "/welcome"
  | "/sign-in"
  | "/training-profile"
  | "/equipment"
  | typeof APP_HOME_ROUTE;

export function resolveOnboardingRoute(input: {
  hasSession: boolean;
  onboardingStatus: OnboardingStatus | null;
  isLoading: boolean;
}): OnboardingRoute | null {
  if (input.isLoading) {
    return null;
  }

  if (!input.hasSession) {
    return "/welcome";
  }

  const status = input.onboardingStatus ?? "not_started";

  if (status === "not_started") {
    return "/training-profile";
  }

  if (status === "profile_complete") {
    return "/equipment";
  }

  return APP_HOME_ROUTE;
}

export function isOnboardingComplete(status: OnboardingStatus | null | undefined): boolean {
  return (
    status === "equipment_complete" ||
    status === "calibration_started" ||
    status === "complete"
  );
}
