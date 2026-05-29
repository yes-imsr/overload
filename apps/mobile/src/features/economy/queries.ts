import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { EconomySnapshot } from "./types";

export const economySnapshotQueryKey = (userId: string) =>
  ["economy", "snapshot", userId] as const;

export function useEconomySnapshot(userId: string | undefined) {
  return useQuery({
    queryKey: economySnapshotQueryKey(userId ?? "none"),
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<EconomySnapshot> => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase.functions.invoke("economy-snapshot", {
        body: {},
      });

      if (error) {
        throw error;
      }

      return data as EconomySnapshot;
    },
    refetchInterval: 30_000,
  });
}

export function useClaimIdleCredits(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase.functions.invoke("claim-idle-credits", {
        body: {
          clientMutationId: `claim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
      });

      if (error) {
        throw error;
      }

      return data as {
        creditsClaimed: number;
        snapshot: EconomySnapshot;
      };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: economySnapshotQueryKey(userId!) });
    },
  });
}

export function useUpgradeNode(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nodeId: string) => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase.functions.invoke("upgrade-node", {
        body: {
          nodeId,
          clientMutationId: `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
      });

      if (error) {
        throw error;
      }

      return data as {
        nodeId: string;
        creditsSpent: number;
        snapshot: EconomySnapshot;
      };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: economySnapshotQueryKey(userId!) });
    },
  });
}
