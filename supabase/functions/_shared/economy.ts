import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  calculateIdleCredits,
  calculateIdleRateFromNodes,
} from "./core-engine.bundle.mjs";

export type SupabaseClient = ReturnType<typeof createClient>;

export type GameStateRow = {
  user_id: string;
  power_balance: number | string | null;
  credits_balance: number | string | null;
  entropy: number | string | null;
  prestige_level: number | null;
  idle_rate: number | string | null;
  last_idle_claim_at: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
};

export type EconomyNodeRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  unlock_credits_cost: number | string;
  base_idle_rate: number | string;
  max_level: number;
  is_active: boolean;
};

export type UserNodeRow = {
  id?: string;
  user_id?: string;
  node_id: string;
  level: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
};

export type EconomySnapshot = {
  state: GameStateRow;
  nodes: EconomyNodeRow[];
  userNodes: UserNodeRow[];
  idleRate: number;
};

export type ClaimCreditsResult = EconomySnapshot & {
  claimedCredits: number;
  elapsedHours: number;
};

const GAME_STATE_SELECT =
  "user_id, power_balance, credits_balance, entropy, prestige_level, idle_rate, last_idle_claim_at, status, created_at, updated_at";

function asNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function toSerializableState(row: GameStateRow): GameStateRow {
  return {
    ...row,
    power_balance: asNumber(row.power_balance),
    credits_balance: asNumber(row.credits_balance),
    entropy: asNumber(row.entropy),
    idle_rate: asNumber(row.idle_rate),
  };
}

function toSerializableNode(row: EconomyNodeRow): EconomyNodeRow {
  return {
    ...row,
    unlock_credits_cost: asNumber(row.unlock_credits_cost),
    base_idle_rate: asNumber(row.base_idle_rate),
  };
}

async function ensureStarterNodes(
  adminClient: SupabaseClient,
  userId: string,
  nowIso: string,
): Promise<void> {
  const { data: freeNodes, error } = await adminClient
    .from("nodes")
    .select("id")
    .eq("is_active", true)
    .eq("unlock_credits_cost", 0);

  if (error) {
    throw error;
  }

  if (!freeNodes?.length) {
    return;
  }

  const freeNodeIds = freeNodes.map((node: { id: string }) => node.id);
  const { data: existingRows, error: existingError } = await adminClient
    .from("user_nodes")
    .select("node_id")
    .eq("user_id", userId)
    .in("node_id", freeNodeIds);

  if (existingError) {
    throw existingError;
  }

  const existingNodeIds = new Set(
    (existingRows ?? []).map((row: { node_id: string }) => row.node_id),
  );
  const missingFreeNodes = freeNodeIds.filter((nodeId) => !existingNodeIds.has(nodeId));

  if (!missingFreeNodes.length) {
    return;
  }

  const { error: insertError } = await adminClient.from("user_nodes").insert(
    missingFreeNodes.map((nodeId) => ({
      user_id: userId,
      node_id: nodeId,
      level: 1,
      is_unlocked: true,
      unlocked_at: nowIso,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

async function loadGameState(
  adminClient: SupabaseClient,
  userId: string,
): Promise<GameStateRow> {
  const { data: existingState, error } = await adminClient
    .from("game_state")
    .select(GAME_STATE_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (existingState) {
    return toSerializableState(existingState as GameStateRow);
  }

  const { data: insertedState, error: insertError } = await adminClient
    .from("game_state")
    .insert({ user_id: userId })
    .select(GAME_STATE_SELECT)
    .single();

  if (insertError) {
    throw insertError;
  }

  return toSerializableState(insertedState as GameStateRow);
}

export async function loadEconomySnapshot(
  adminClient: SupabaseClient,
  userId: string,
  nowIso: string,
): Promise<EconomySnapshot> {
  await ensureStarterNodes(adminClient, userId, nowIso);

  const [state, nodesResult, userNodesResult] = await Promise.all([
    loadGameState(adminClient, userId),
    adminClient
      .from("nodes")
      .select("id, slug, name, description, sort_order, unlock_credits_cost, base_idle_rate, max_level, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    adminClient
      .from("user_nodes")
      .select("id, user_id, node_id, level, is_unlocked, unlocked_at")
      .eq("user_id", userId),
  ]);

  if (nodesResult.error) {
    throw nodesResult.error;
  }
  if (userNodesResult.error) {
    throw userNodesResult.error;
  }

  const nodes = ((nodesResult.data ?? []) as EconomyNodeRow[]).map(toSerializableNode);
  const userNodes = (userNodesResult.data ?? []) as UserNodeRow[];
  const nodeRatesById = new Map(
    nodes.map((node) => [node.id, asNumber(node.base_idle_rate)] as const),
  );
  const idleRate = calculateIdleRateFromNodes({
    nodes: userNodes.map((userNode) => ({
      baseIdleRate: nodeRatesById.get(userNode.node_id) ?? 0,
      level: userNode.level,
      isUnlocked: userNode.is_unlocked,
    })),
  });

  if (asNumber(state.idle_rate) !== idleRate) {
    const { data: updatedState, error: updateError } = await adminClient
      .from("game_state")
      .update({ idle_rate: idleRate })
      .eq("user_id", userId)
      .select(GAME_STATE_SELECT)
      .single();

    if (updateError) {
      throw updateError;
    }

    return {
      state: toSerializableState(updatedState as GameStateRow),
      nodes,
      userNodes,
      idleRate,
    };
  }

  return { state, nodes, userNodes, idleRate };
}

export async function claimCreditsForUser(
  adminClient: SupabaseClient,
  userId: string,
  nowIso: string,
  clientMutationId: string | null,
): Promise<ClaimCreditsResult> {
  const snapshot = await loadEconomySnapshot(adminClient, userId, nowIso);
  const powerBalance = asNumber(snapshot.state.power_balance);
  const lastClaimAtIso =
    snapshot.state.last_idle_claim_at ??
    (powerBalance > 0 ? snapshot.state.created_at ?? nowIso : nowIso);
  const { elapsedHours, creditsGenerated } = calculateIdleCredits({
    powerBalance,
    idleRate: snapshot.idleRate,
    lastClaimAtIso,
    nowIso,
  });
  const nextCreditsBalance = roundCurrency(
    asNumber(snapshot.state.credits_balance) + creditsGenerated,
  );

  const { data: updatedState, error: updateError } = await adminClient
    .from("game_state")
    .update({
      credits_balance: nextCreditsBalance,
      idle_rate: snapshot.idleRate,
      last_idle_claim_at: nowIso,
    })
    .eq("user_id", userId)
    .select(GAME_STATE_SELECT)
    .single();

  if (updateError) {
    throw updateError;
  }

  if (creditsGenerated > 0) {
    const { error: eventError } = await adminClient.from("game_events").insert({
      user_id: userId,
      event_type: "credits_claimed",
      source_type: "system",
      credits_delta: creditsGenerated,
      metadata: {
        clientMutationId,
        elapsedHours,
        idleRate: snapshot.idleRate,
        powerBalance,
      },
    });

    if (eventError) {
      throw eventError;
    }
  }

  return {
    ...snapshot,
    state: toSerializableState(updatedState as GameStateRow),
    claimedCredits: creditsGenerated,
    elapsedHours,
  };
}

export const economyNumber = asNumber;
export const economyRoundCurrency = roundCurrency;
