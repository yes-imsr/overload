import { Redirect } from "expo-router";
import { SystemState } from "@/components";
import { useProfileQuery } from "@/features/onboarding/api";
import { useAuth } from "@/providers/auth-provider";

export default function IndexRoute() {
  const { isConfigured, isLoading, user } = useAuth();
  const profileQuery = useProfileQuery(user?.id);

  if (!isConfigured) {
    return (
      <SystemState
        eyebrow="Supabase offline"
        title="Backend link required"
        body="Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY before account entry can run."
      />
    );
  }

  if (isLoading || (user && profileQuery.isLoading)) {
    return (
      <SystemState
        eyebrow="Routing"
        title="Reading operator state"
        loading
      />
    );
  }

  if (!user || profileQuery.data?.onboarding_status !== "complete") {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/home" />;
}
