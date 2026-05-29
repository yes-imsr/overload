import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  claimCreditsForUser,
  economyNumber,
  economyRoundCurrency,
  loadEconomySnapshot,
} from "../_shared/economy.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

class EconomyActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const body = await request.json().catch(() => ({}));
    const nodeSlug = typeof body.nodeSlug === "string" ? body.nodeSlug : null;
    const nodeId = typeof body.nodeId === "string" ? body.nodeId : null;
    const clientMutationId =
      typeof body.clientMutationId === "string" ? body.clientMutationId : null;

    if (!nodeSlug && !nodeId) {
      return jsonResponse({ error: "nodeSlug or nodeId is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const nowIso = new Date().toISOString();
    const claimResult = await claimCreditsForUser(
      adminClient,
      user.id,
      nowIso,
      clientMutationId,
    );
    const node = claimResult.nodes.find((entry) =>
      nodeSlug ? entry.slug === nodeSlug : entry.id === nodeId,
    );

    if (!node) {
      return jsonResponse({ error: "Node not found" }, 404);
    }

    const existingNode = claimResult.userNodes.find(
      (entry) => entry.node_id === node.id && entry.is_unlocked,
    );
    if (existingNode && existingNode.level >= node.max_level) {
      return jsonResponse({
        status: "already_unlocked",
        claimedCredits: claimResult.claimedCredits,
        gameState: claimResult.state,
        nodes: claimResult.nodes,
        userNodes: claimResult.userNodes,
      });
    }

    const cost = economyNumber(node.unlock_credits_cost);
    const currentCredits = economyNumber(claimResult.state.credits_balance);
    if (currentCredits < cost) {
      throw new EconomyActionError("Insufficient Credits", 409);
    }

    const nextCreditsBalance = economyRoundCurrency(currentCredits - cost);

    const { error: upsertError } = await adminClient.from("user_nodes").upsert(
      {
        user_id: user.id,
        node_id: node.id,
        level: 1,
        is_unlocked: true,
        unlocked_at: nowIso,
      },
      { onConflict: "user_id,node_id" },
    );

    if (upsertError) {
      throw upsertError;
    }

    const upgradedSnapshot = await loadEconomySnapshot(adminClient, user.id, nowIso);
    const { data: updatedState, error: updateError } = await adminClient
      .from("game_state")
      .update({
        credits_balance: nextCreditsBalance,
        idle_rate: upgradedSnapshot.idleRate,
      })
      .eq("user_id", user.id)
      .select("user_id, power_balance, credits_balance, entropy, prestige_level, idle_rate, last_idle_claim_at, status, created_at, updated_at")
      .single();

    if (updateError) {
      throw updateError;
    }

    const { error: eventError } = await adminClient.from("game_events").insert({
      user_id: user.id,
      event_type: "node_upgraded",
      source_type: "node",
      source_id: node.id,
      credits_delta: -cost,
      metadata: {
        clientMutationId,
        nodeSlug: node.slug,
        previousIdleRate: claimResult.idleRate,
        nextIdleRate: upgradedSnapshot.idleRate,
        claimedCreditsBeforeSpend: claimResult.claimedCredits,
      },
    });

    if (eventError) {
      throw eventError;
    }

    return jsonResponse({
      status: "upgraded",
      spentCredits: cost,
      claimedCredits: claimResult.claimedCredits,
      gameState: updatedState,
      nodes: upgradedSnapshot.nodes,
      userNodes: upgradedSnapshot.userNodes,
    });
  } catch (error) {
    if (error instanceof EconomyActionError) {
      return jsonResponse({ error: error.message }, error.status);
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
