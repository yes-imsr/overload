import { PropsWithChildren, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authSessionQueryKey } from "@/features/onboarding/queries";
import { supabase } from "@/lib/supabase";

/** Keeps TanStack Query session cache in sync with Supabase auth events. */
export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(authSessionQueryKey, session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return children;
}
