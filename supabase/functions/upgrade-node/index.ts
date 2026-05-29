import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  evaluateNodeUnlock,
  fetchCatalogNodes,
  fetchGameState,
  fetchUserNodes,
  loadEconomySnapshot,
  resolveIdleRateFromUserNodes,
} from "../_shared/economy.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { nodeId, clientMutationId } = await request.json();
    if (!nodeId || !clientMutationId) {
      return new Response(JSON.stringify({ error: "nodeId and clientMutationId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nowIso = new Date().toISOString();
    const [gameState, catalogNodes, userNodes] = await Promise.all([
      fetchGameState(adminClient, user.id),
      fetchCatalogNodes(adminClient),
      fetchUserNodes(adminClient, user.id),
    ]);

    if (!gameState) {
      return new Response(JSON.stringify({ error: "game_state row missing" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nodeIndex = catalogNodes.findIndex((node) => node.id === nodeId);
    if (nodeIndex < 0) {
      return new Response(JSON.stringify({ error: "Node not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const node = catalogNodes[nodeIndex]!;
    const owned = userNodes.find((entry) => entry.node_id === nodeId);
    const prerequisiteUnlocked =
      nodeIndex === 0
        ? true
        : Boolean(userNodes.find((entry) => entry.node_id === catalogNodes[nodeIndex - 1]!.id)?.is_unlocked);

    const evaluation = evaluateNodeUnlock({
      creditsBalance: Number(gameState.credits_balance),
      unlockCreditsCost: Number(node.unlock_credits_cost),
      isAlreadyUnlocked: Boolean(owned?.is_unlocked),
      prerequisiteUnlocked,
    });

    if (!evaluation.allowed) {
      return new Response(JSON.stringify({ error: evaluation.reasonCode }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nextCreditsBalance = Number(gameState.credits_balance) - evaluation.creditCost;
    const { error: upsertError } = await adminClient.from("user_nodes").upsert(
      {
        user_id: user.id,
        node_id: nodeId,
        level: 1,
        is_unlocked: true,
        unlocked_at: nowIso,
      },
      { onConflict: "user_id,node_id" },
    );

    if (upsertError) {
      throw upsertError;
    }

    const refreshedUserNodes = await fetchUserNodes(adminClient, user.id);
    const idleRate = resolveIdleRateFromUserNodes(catalogNodes, refreshedUserNodes);

    const { error: updateError } = await adminClient
      .from("game_state")
      .update({
        credits_balance: nextCreditsBalance,
        idle_rate: idleRate,
      })
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    await adminClient.from("game_events").insert({
      user_id: user.id,
      event_type: "node_unlocked",
      source_type: "node",
      source_id: nodeId,
      credits_delta: -evaluation.creditCost,
      metadata: {
        clientMutationId,
        nodeSlug: node.slug,
        idleRate,
      },
    });

    const snapshot = await loadEconomySnapshot(adminClient, user.id, nowIso);

    return new Response(
      JSON.stringify({
        nodeId,
        creditsSpent: evaluation.creditCost,
        snapshot,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
