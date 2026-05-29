import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { EconomyNode, GameState, UserNode } from "@/types/database";

export type EconomyState = {
  gameState: GameState | null;
  nodes: EconomyNode[];
  userNodes: UserNode[];
};

export type ClaimCreditsResponse = EconomyState & {
  claimedCredits: number;
  elapsedHours: number;
};

export type UpgradeNodeResponse = EconomyState & {
  status: "upgraded" | "already_unlocked";
  spentCredits?: number;
  claimedCredits: number;
};

export const economyStateQueryKey = (userId: string) => ["economy", userId] as const;

function makeClientMutationId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}`;
}

export function economyNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatEconomyNumber(value: number | string | null | undefined): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(economyNumber(value));
}

export function useEconomyState(userId: string | undefined) {
  return useQuery({
    queryKey: economyStateQueryKey(userId ?? "none"),
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<EconomyState> => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const [gameStateResult, nodesResult, userNodesResult] = await Promise.all([
        supabase
          .from("game_state")
          .select("user_id, power_balance, credits_balance, entropy, prestige_level, idle_rate, last_idle_claim_at, status, created_at, updated_at")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("nodes")
          .select("id, slug, name, description, sort_order, unlock_credits_cost, base_idle_rate, max_level, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("user_nodes")
          .select("id, user_id, node_id, level, is_unlocked, unlocked_at")
          .eq("user_id", userId),
      ]);

      if (gameStateResult.error) {
        throw gameStateResult.error;
      }
      if (nodesResult.error) {
        throw nodesResult.error;
      }
      if (userNodesResult.error) {
        throw userNodesResult.error;
      }

      return {
        gameState: (gameStateResult.data ?? null) as GameState | null,
        nodes: (nodesResult.data ?? []) as EconomyNode[],
        userNodes: (userNodesResult.data ?? []) as UserNode[],
      };
    },
  });
}

export function useClaimCredits(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ClaimCreditsResponse> => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase.functions.invoke("claim-credits", {
        body: { clientMutationId: makeClientMutationId("claim") },
      });

      if (error) {
        throw error;
      }

      return data as ClaimCreditsResponse;
    },
    onSettled: async () => {
      if (userId) {
        await queryClient.invalidateQueries({ queryKey: economyStateQueryKey(userId) });
      }
    },
  });
}

export function useUpgradeNode(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nodeSlug: string): Promise<UpgradeNodeResponse> => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase.functions.invoke("upgrade-node", {
        body: {
          nodeSlug,
          clientMutationId: makeClientMutationId("node"),
        },
      });

      if (error) {
        throw error;
      }

      return data as UpgradeNodeResponse;
    },
    onSettled: async () => {
      if (userId) {
        await queryClient.invalidateQueries({ queryKey: economyStateQueryKey(userId) });
      }
    },
  });
}
