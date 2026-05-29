import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  calculateAggregateIdleRate,
  calculateIdleCredits,
  evaluateNodeUnlock,
} from "./core-engine.bundle.mjs";

export const CORE_REACTOR_NODE_ID = "b0000001-0000-4000-8000-000000000001";

export type CatalogNodeRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  unlock_credits_cost: number;
  base_idle_rate: number;
  max_level: number;
  is_active: boolean;
};

export type UserNodeRow = {
  node_id: string;
  level: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
};

export type GameStateRow = {
  user_id: string;
  power_balance: number;
  credits_balance: number;
  idle_rate: number;
  last_idle_claim_at: string | null;
  created_at: string;
};

export type EconomyNodeSnapshot = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  unlockCreditsCost: number;
  baseIdleRate: number;
  isUnlocked: boolean;
  level: number;
  canUnlock: boolean;
  blockReason: string | null;
};

export type EconomySnapshot = {
  powerBalance: number;
  creditsBalance: number;
  idleRate: number;
  pendingCredits: number;
  elapsedHours: number;
  lastClaimAt: string;
  creditsPerHourAtCurrentPower: number;
  nodes: EconomyNodeSnapshot[];
};

type AdminClient = ReturnType<typeof createClient>;

export async function fetchCatalogNodes(adminClient: AdminClient): Promise<CatalogNodeRow[]> {
  const { data, error } = await adminClient
    .from("nodes")
    .select(
      "id, slug, name, description, sort_order, unlock_credits_cost, base_idle_rate, max_level, is_active",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as CatalogNodeRow[];
}

export async function fetchUserNodes(
  adminClient: AdminClient,
  userId: string,
): Promise<UserNodeRow[]> {
  const { data, error } = await adminClient
    .from("user_nodes")
    .select("node_id, level, is_unlocked, unlocked_at")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return (data ?? []) as UserNodeRow[];
}

export async function fetchGameState(
  adminClient: AdminClient,
  userId: string,
): Promise<GameStateRow | null> {
  const { data, error } = await adminClient
    .from("game_state")
    .select("user_id, power_balance, credits_balance, idle_rate, last_idle_claim_at, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as GameStateRow | null) ?? null;
}

export async function ensureCoreReactorUnlocked(
  adminClient: AdminClient,
  userId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await adminClient.from("user_nodes").upsert(
    {
      user_id: userId,
      node_id: CORE_REACTOR_NODE_ID,
      level: 1,
      is_unlocked: true,
      unlocked_at: now,
    },
    { onConflict: "user_id,node_id" },
  );

  if (error) {
    throw error;
  }
}

function userNodeMap(rows: UserNodeRow[]): Map<string, UserNodeRow> {
  return new Map(rows.map((row) => [row.node_id, row]));
}

export function buildEconomySnapshot(input: {
  gameState: GameStateRow;
  catalogNodes: CatalogNodeRow[];
  userNodes: UserNodeRow[];
  nowIso: string;
}): EconomySnapshot {
  const userNodesById = userNodeMap(input.userNodes);
  const unlockedNodes = input.catalogNodes.map((node) => {
    const owned = userNodesById.get(node.id);
    return {
      isUnlocked: Boolean(owned?.is_unlocked),
      level: Number(owned?.level ?? 0),
      baseIdleRate: Number(node.base_idle_rate),
    };
  });

  const idleRate = calculateAggregateIdleRate(unlockedNodes);
  const lastClaimAt =
    input.gameState.last_idle_claim_at ?? input.gameState.created_at ?? input.nowIso;
  const pending = calculateIdleCredits({
    powerBalance: Number(input.gameState.power_balance),
    idleRate,
    lastClaimAtIso: lastClaimAt,
    nowIso: input.nowIso,
  });

  const creditsBalance = Number(input.gameState.credits_balance);
  const powerBalance = Number(input.gameState.power_balance);

  const nodes: EconomyNodeSnapshot[] = input.catalogNodes.map((node, index) => {
    const owned = userNodesById.get(node.id);
    const isUnlocked = Boolean(owned?.is_unlocked);
    const prerequisiteUnlocked =
      index === 0
        ? true
        : Boolean(userNodesById.get(input.catalogNodes[index - 1]!.id)?.is_unlocked);
    const evaluation = evaluateNodeUnlock({
      creditsBalance,
      unlockCreditsCost: Number(node.unlock_credits_cost),
      isAlreadyUnlocked: isUnlocked,
      prerequisiteUnlocked,
    });

    return {
      id: node.id,
      slug: node.slug,
      name: node.name,
      description: node.description,
      sortOrder: node.sort_order,
      unlockCreditsCost: Number(node.unlock_credits_cost),
      baseIdleRate: Number(node.base_idle_rate),
      isUnlocked,
      level: Number(owned?.level ?? 0),
      canUnlock: evaluation.allowed,
      blockReason: evaluation.allowed ? null : evaluation.reasonCode,
    };
  });

  return {
    powerBalance,
    creditsBalance,
    idleRate,
    pendingCredits: pending.creditsGenerated,
    elapsedHours: pending.elapsedHours,
    lastClaimAt,
    creditsPerHourAtCurrentPower: powerBalance * idleRate,
    nodes,
  };
}

export async function loadEconomySnapshot(
  adminClient: AdminClient,
  userId: string,
  nowIso: string,
): Promise<EconomySnapshot> {
  await ensureCoreReactorUnlocked(adminClient, userId);

  const [gameState, catalogNodes, userNodes] = await Promise.all([
    fetchGameState(adminClient, userId),
    fetchCatalogNodes(adminClient),
    fetchUserNodes(adminClient, userId),
  ]);

  if (!gameState) {
    throw new Error("game_state row missing for user");
  }

  return buildEconomySnapshot({
    gameState,
    catalogNodes,
    userNodes,
    nowIso,
  });
}

export async function persistIdleRate(
  adminClient: AdminClient,
  userId: string,
  idleRate: number,
): Promise<void> {
  const { error } = await adminClient
    .from("game_state")
    .update({ idle_rate: idleRate })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export function resolveIdleRateFromUserNodes(
  catalogNodes: CatalogNodeRow[],
  userNodes: UserNodeRow[],
): number {
  const userNodesById = userNodeMap(userNodes);
  return calculateAggregateIdleRate(
    catalogNodes.map((node) => {
      const owned = userNodesById.get(node.id);
      return {
        isUnlocked: Boolean(owned?.is_unlocked),
        level: Number(owned?.level ?? 0),
        baseIdleRate: Number(node.base_idle_rate),
      };
    }),
  );
}

export { calculateIdleCredits, evaluateNodeUnlock };
