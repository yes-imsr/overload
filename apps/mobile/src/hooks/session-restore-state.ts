import type { OnboardingRoute } from "@/features/onboarding/onboarding-routes";

export const SESSION_RESTORE_ERROR_MESSAGE =
  "Unable to restore session. Sign in again.";

export type SessionRestoreFailureState = {
  redirect: OnboardingRoute;
  isLoading: false;
  sessionRestoreError: string;
};

export function resolveSessionRestoreFailureState(): SessionRestoreFailureState {
  return {
    redirect: "/welcome",
    isLoading: false,
    sessionRestoreError: SESSION_RESTORE_ERROR_MESSAGE,
  };
}
