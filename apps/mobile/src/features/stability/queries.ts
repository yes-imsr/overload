import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { StabilitySnapshot } from "./types";

export const stabilitySnapshotQueryKey = (userId: string) =>
  ["stability", "snapshot", userId] as const;

export async function revealPendingStabilityTaskIfNeeded(
  sessionId: string,
): Promise<StabilitySnapshot | null> {
  if (!supabase) {
    return null;
  }

  const { data: snapshot, error: snapshotError } = await supabase.functions.invoke(
    "stability-snapshot",
    { body: {} },
  );

  if (snapshotError) {
    throw snapshotError;
  }

  const stability = snapshot as StabilitySnapshot;
  if (!stability.canReveal || !stability.debuff) {
    return stability;
  }

  const { data, error } = await supabase.functions.invoke("reveal-debuff", {
    body: {
      debuffId: stability.debuff.id,
      sessionId,
    },
  });

  if (error) {
    throw error;
  }

  return (data as { snapshot: StabilitySnapshot }).snapshot;
}

export function useStabilitySnapshot(userId: string | undefined) {
  return useQuery({
    queryKey: stabilitySnapshotQueryKey(userId ?? "none"),
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<StabilitySnapshot> => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase.functions.invoke("stability-snapshot", {
        body: {},
      });

      if (error) {
        throw error;
      }

      return data as StabilitySnapshot;
    },
    refetchInterval: 30_000,
  });
}

export function useResolveStabilityTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (debuffId: string) => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase.functions.invoke("resolve-debuff", {
        body: {
          debuffId,
          resolutionType: "time",
        },
      });

      if (error) {
        throw error;
      }

      return data as { snapshot: StabilitySnapshot };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stabilitySnapshotQueryKey(userId!) });
    },
  });
}

export function useRevealStabilityTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { debuffId: string; sessionId: string }) => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase.functions.invoke("reveal-debuff", {
        body: input,
      });

      if (error) {
        throw error;
      }

      return data as { snapshot: StabilitySnapshot };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stabilitySnapshotQueryKey(userId!) });
    },
  });
}
