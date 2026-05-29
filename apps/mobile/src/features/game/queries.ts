import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { GameState, StabilityTaskDebuff } from "@/types/database";

export const gameStateQueryKey = (userId: string) => ["game", "state", userId] as const;
export const activeStabilityTaskQueryKey = (userId: string) =>
  ["game", "stability-task", userId] as const;

function normalizeGameState(row: GameState): GameState {
  return {
    ...row,
    power_balance: Number(row.power_balance ?? 0),
    credits_balance: Number(row.credits_balance ?? 0),
    entropy: Number(row.entropy ?? 0),
    prestige_level: Number(row.prestige_level ?? 0),
    idle_rate: Number(row.idle_rate ?? 0),
  };
}

function normalizeStabilityTask(row: StabilityTaskDebuff): StabilityTaskDebuff {
  return {
    ...row,
    effect_value: Number(row.effect_value ?? 0.15),
  };
}

async function invalidateGameQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: gameStateQueryKey(userId) }),
    queryClient.invalidateQueries({ queryKey: activeStabilityTaskQueryKey(userId) }),
  ]);
}

export function useGameState(userId: string | undefined) {
  return useQuery({
    queryKey: gameStateQueryKey(userId ?? "none"),
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<GameState | null> => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase
        .from("game_state")
        .select(
          "user_id, power_balance, credits_balance, entropy, prestige_level, idle_rate, current_debuff_id, status",
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? normalizeGameState(data as GameState) : null;
    },
  });
}

export function useActiveStabilityTask(userId: string | undefined) {
  return useQuery({
    queryKey: activeStabilityTaskQueryKey(userId ?? "none"),
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<StabilityTaskDebuff | null> => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase
        .from("debuffs")
        .select("id, user_id, debuff_type, status, assigned_at, revealed_at, resolved_at, effect_value")
        .eq("user_id", userId)
        .eq("debuff_type", "power_gain_reduction")
        .in("status", ["pending_reveal", "active"])
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? normalizeStabilityTask(data as StabilityTaskDebuff) : null;
    },
  });
}

export function useRevealStabilityTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase.functions.invoke("reveal-stability-task");
      if (error) {
        throw error;
      }

      return data as {
        stabilityTaskId: string;
        status: "active";
        revealedAt?: string;
      };
    },
    onSuccess: async () => {
      if (userId) {
        await invalidateGameQueries(queryClient, userId);
      }
    },
  });
}

export function useResolveStabilityTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase.functions.invoke("resolve-stability-task");
      if (error) {
        throw error;
      }

      return data as {
        stabilityTaskId: string;
        status: "resolved";
        entropy: number;
        entropyDelta: number;
      };
    },
    onSuccess: async () => {
      if (userId) {
        await invalidateGameQueries(queryClient, userId);
      }
    },
  });
}
