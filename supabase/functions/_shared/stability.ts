import {
  calculateEntropyAfterWorkout,
  ENTROPY_MISS_WORKOUT_GRACE_DAYS,
  ENTROPY_MISS_WORKOUT_PER_DAY,
  ENTROPY_STABILITY_TASK_THRESHOLD,
  evaluateStabilityTaskAssignment,
  resolveStabilityTask,
  STABILITY_TASK_DEBUFF_TYPE,
} from "./core-engine.bundle.mjs";
import type { AdminClient } from "./supabase-types.ts";

export type GameStateRow = {
  user_id: string;
  power_balance: number;
  credits_balance: number;
  entropy: number;
  idle_rate: number;
  last_idle_claim_at: string | null;
  current_debuff_id: string | null;
  status: "active" | "prestige_locked" | "debuffed";
  created_at: string;
};

export type DebuffRow = {
  id: string;
  user_id: string;
  debuff_type: string;
  status: "pending_reveal" | "active" | "resolved" | "expired";
  assigned_at: string;
  revealed_at: string | null;
  resolved_at: string | null;
  expires_at: string | null;
  source_session_id: string | null;
  resolution_session_id: string | null;
  effect_value: number;
  metadata: Record<string, unknown>;
};

export type StabilityDebuffSnapshot = {
  id: string;
  debuffType: string;
  status: DebuffRow["status"];
  effectValue: number;
  assignedAt: string;
  revealedAt: string | null;
  label: string;
  cause: string;
  effect: string;
  action: string;
};

export type StabilitySnapshot = {
  entropy: number;
  entropyRisk: boolean;
  gameStatus: GameStateRow["status"];
  debuff: StabilityDebuffSnapshot | null;
  canReveal: boolean;
  canResolve: boolean;
};

const STABILITY_TASK_LABEL = "Stability Task";
const STABILITY_TASK_CAUSE = "Entropy Spike detected from missed sessions or unstable training signals.";
const STABILITY_TASK_EFFECT = "Power gain reduced by 15% until the task is resolved.";
const STABILITY_TASK_ACTION = "Complete one Stability Task to reduce risk.";

export async function fetchGameState(
  adminClient: AdminClient,
  userId: string,
): Promise<GameStateRow | null> {
  const { data, error } = await adminClient
    .from("game_state")
    .select(
      "user_id, power_balance, credits_balance, entropy, idle_rate, last_idle_claim_at, current_debuff_id, status, created_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as GameStateRow | null) ?? null;
}

export async function ensureGameState(
  adminClient: AdminClient,
  userId: string,
): Promise<GameStateRow> {
  const existing = await fetchGameState(adminClient, userId);
  if (existing) {
    return existing;
  }

  const { data, error } = await adminClient
    .from("game_state")
    .insert({ user_id: userId })
    .select(
      "user_id, power_balance, credits_balance, entropy, idle_rate, last_idle_claim_at, current_debuff_id, status, created_at",
    )
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create game_state row");
  }

  return data as GameStateRow;
}

export async function fetchDebuffById(
  adminClient: AdminClient,
  debuffId: string,
  userId: string,
): Promise<DebuffRow | null> {
  const { data, error } = await adminClient
    .from("debuffs")
    .select(
      "id, user_id, debuff_type, status, assigned_at, revealed_at, resolved_at, expires_at, source_session_id, resolution_session_id, effect_value, metadata",
    )
    .eq("id", debuffId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as DebuffRow | null) ?? null;
}

export async function fetchCurrentDebuff(
  adminClient: AdminClient,
  userId: string,
  currentDebuffId: string | null,
): Promise<DebuffRow | null> {
  if (currentDebuffId) {
    const linked = await fetchDebuffById(adminClient, currentDebuffId, userId);
    if (linked && (linked.status === "pending_reveal" || linked.status === "active")) {
      return linked;
    }
  }

  const { data, error } = await adminClient
    .from("debuffs")
    .select(
      "id, user_id, debuff_type, status, assigned_at, revealed_at, resolved_at, expires_at, source_session_id, resolution_session_id, effect_value, metadata",
    )
    .eq("user_id", userId)
    .in("status", ["pending_reveal", "active"])
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as DebuffRow | null) ?? null;
}

function daysSinceLastWorkout(lastCompletedAtIso: string | null, nowIso: string): number {
  if (!lastCompletedAtIso) {
    return 0;
  }

  const lastMs = Date.parse(lastCompletedAtIso);
  const nowMs = Date.parse(nowIso);
  if (!Number.isFinite(lastMs) || !Number.isFinite(nowMs) || nowMs < lastMs) {
    return 0;
  }

  return Math.floor((nowMs - lastMs) / (24 * 60 * 60 * 1000));
}

async function fetchLastCompletedWorkoutAt(
  adminClient: AdminClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await adminClient
    .from("workout_sessions")
    .select("completed_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as { completed_at: string | null } | null)?.completed_at ?? null;
}

async function fetchLastSyncedMissedWorkDays(
  adminClient: AdminClient,
  userId: string,
): Promise<number> {
  const { data, error } = await adminClient
    .from("game_events")
    .select("metadata")
    .eq("user_id", userId)
    .eq("event_type", "correction_applied")
    .filter("metadata->>entropyReason", "eq", "missed_workouts")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const syncedDays = (data as { metadata?: { missedWorkDays?: number } } | null)?.metadata
    ?.missedWorkDays;
  return typeof syncedDays === "number" && syncedDays >= 0 ? syncedDays : 0;
}

function missedWorkDays(daysSinceLastWorkout: number): number {
  return Math.max(0, daysSinceLastWorkout - ENTROPY_MISS_WORKOUT_GRACE_DAYS);
}

export async function syncMissedWorkEntropy(
  adminClient: AdminClient,
  userId: string,
  nowIso: string,
): Promise<{ entropy: number; delta: number }> {
  const gameState = await ensureGameState(adminClient, userId);
  const lastCompletedAt = await fetchLastCompletedWorkoutAt(adminClient, userId);
  const daysSince = daysSinceLastWorkout(lastCompletedAt, nowIso);
  const currentMissedDays = missedWorkDays(daysSince);

  if (currentMissedDays === 0) {
    return { entropy: Number(gameState.entropy), delta: 0 };
  }

  const lastSyncedMissedDays = await fetchLastSyncedMissedWorkDays(adminClient, userId);
  if (currentMissedDays <= lastSyncedMissedDays) {
    return { entropy: Number(gameState.entropy), delta: 0 };
  }

  const incrementalDays = currentMissedDays - lastSyncedMissedDays;
  const delta = incrementalDays * ENTROPY_MISS_WORKOUT_PER_DAY;
  const nextEntropy = Number(gameState.entropy) + delta;

  const { error: updateError } = await adminClient
    .from("game_state")
    .update({ entropy: nextEntropy })
    .eq("user_id", userId);

  if (updateError) {
    throw updateError;
  }

  await adminClient.from("game_events").insert({
    user_id: userId,
    event_type: "correction_applied",
    source_type: "system",
    source_id: null,
    entropy_delta: delta,
    metadata: {
      entropyReason: "missed_workouts",
      missedWorkDays: currentMissedDays,
      daysSinceLastWorkout: daysSince,
    },
  });

  return { entropy: nextEntropy, delta };
}

export function buildDebuffSnapshot(debuff: DebuffRow): StabilityDebuffSnapshot {
  return {
    id: debuff.id,
    debuffType: debuff.debuff_type,
    status: debuff.status,
    effectValue: Number(debuff.effect_value),
    assignedAt: debuff.assigned_at,
    revealedAt: debuff.revealed_at,
    label: STABILITY_TASK_LABEL,
    cause: STABILITY_TASK_CAUSE,
    effect: STABILITY_TASK_EFFECT,
    action: STABILITY_TASK_ACTION,
  };
}

export function buildStabilitySnapshot(input: {
  gameState: GameStateRow;
  debuff: DebuffRow | null;
}): StabilitySnapshot {
  const entropy = Number(input.gameState.entropy);
  const debuffSnapshot = input.debuff ? buildDebuffSnapshot(input.debuff) : null;

  return {
    entropy,
    entropyRisk: entropy >= ENTROPY_STABILITY_TASK_THRESHOLD || debuffSnapshot !== null,
    gameStatus: input.gameState.status,
    debuff: debuffSnapshot,
    canReveal: debuffSnapshot?.status === "pending_reveal",
    canResolve: debuffSnapshot?.status === "active",
  };
}

export async function loadStabilitySnapshot(
  adminClient: AdminClient,
  userId: string,
  nowIso: string,
): Promise<StabilitySnapshot> {
  await syncMissedWorkEntropy(adminClient, userId, nowIso);
  const gameState = await ensureGameState(adminClient, userId);
  const debuff = await fetchCurrentDebuff(
    adminClient,
    userId,
    gameState.current_debuff_id,
  );

  return buildStabilitySnapshot({ gameState, debuff });
}

export async function applyWorkoutEntropy(
  adminClient: AdminClient,
  userId: string,
  input: { hasNearDeathEffort: boolean; staleExerciseCount: number },
  nowIso: string,
): Promise<number> {
  const gameState = await ensureGameState(adminClient, userId);
  const result = calculateEntropyAfterWorkout(Number(gameState.entropy), input);

  if (result.delta === 0) {
    return Number(gameState.entropy);
  }

  const { error } = await adminClient
    .from("game_state")
    .update({ entropy: result.nextEntropy })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  await adminClient.from("game_events").insert({
    user_id: userId,
    event_type: "workout_completed",
    source_type: "system",
    source_id: null,
    entropy_delta: result.delta,
    metadata: {
      entropyReason: "workout_signals",
      reasons: result.reasons,
      syncedAt: nowIso,
    },
  });

  return result.nextEntropy;
}

export async function assignStabilityTaskIfNeeded(
  adminClient: AdminClient,
  userId: string,
  entropy: number,
  sourceSessionId: string | null,
): Promise<DebuffRow | null> {
  const existing = await fetchCurrentDebuff(adminClient, userId, null);
  const hasActiveStabilityTask = existing !== null;

  const evaluation = evaluateStabilityTaskAssignment({
    entropy,
    hasActiveStabilityTask,
  });

  if (!evaluation.shouldAssign) {
    return null;
  }

  const { data: inserted, error: insertError } = await adminClient
    .from("debuffs")
    .insert({
      user_id: userId,
      debuff_type: STABILITY_TASK_DEBUFF_TYPE,
      status: "pending_reveal",
      source_session_id: sourceSessionId,
      effect_value: 0.15,
      metadata: { label: STABILITY_TASK_LABEL },
    })
    .select(
      "id, user_id, debuff_type, status, assigned_at, revealed_at, resolved_at, expires_at, source_session_id, resolution_session_id, effect_value, metadata",
    )
    .single();

  if (insertError || !inserted) {
    throw insertError ?? new Error("Failed to assign Stability Task");
  }

  const debuff = inserted as DebuffRow;

  const { error: stateError } = await adminClient
    .from("game_state")
    .update({ current_debuff_id: debuff.id })
    .eq("user_id", userId);

  if (stateError) {
    throw stateError;
  }

  await adminClient.from("game_events").insert({
    user_id: userId,
    event_type: "debuff_assigned",
    source_type: "debuff",
    source_id: debuff.id,
    metadata: {
      debuffType: debuff.debuff_type,
      label: STABILITY_TASK_LABEL,
    },
  });

  return debuff;
}

export async function revealStabilityTask(
  adminClient: AdminClient,
  userId: string,
  debuffId: string,
  sessionId: string,
): Promise<StabilitySnapshot> {
  const debuff = await fetchDebuffById(adminClient, debuffId, userId);
  if (!debuff) {
    throw new Error("Stability Task not found");
  }
  if (debuff.status !== "pending_reveal") {
    throw new Error("Stability Task is not pending reveal");
  }

  const { data: session, error: sessionError } = await adminClient
    .from("workout_sessions")
    .select("id, user_id, status")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionError || !session) {
    throw new Error("Workout session not found");
  }
  if (session.status !== "in_progress") {
    throw new Error("Workout session must be in progress to reveal Stability Task");
  }

  const nowIso = new Date().toISOString();

  const { error: debuffError } = await adminClient
    .from("debuffs")
    .update({
      status: "active",
      revealed_at: nowIso,
    })
    .eq("id", debuffId)
    .eq("user_id", userId);

  if (debuffError) {
    throw debuffError;
  }

  const { error: stateError } = await adminClient
    .from("game_state")
    .update({
      status: "debuffed",
      current_debuff_id: debuffId,
    })
    .eq("user_id", userId);

  if (stateError) {
    throw stateError;
  }

  await adminClient.from("game_events").insert({
    user_id: userId,
    event_type: "debuff_revealed",
    source_type: "debuff",
    source_id: debuffId,
    metadata: { sessionId, label: STABILITY_TASK_LABEL },
  });

  return loadStabilitySnapshot(adminClient, userId, nowIso);
}

export async function resolveStabilityTaskRecord(
  adminClient: AdminClient,
  userId: string,
  debuffId: string,
  input: {
    resolutionType: "time" | "workout_completion";
    sessionId?: string;
  },
): Promise<StabilitySnapshot> {
  const debuff = await fetchDebuffById(adminClient, debuffId, userId);
  if (!debuff) {
    throw new Error("Stability Task not found");
  }
  if (debuff.status !== "active") {
    throw new Error("Stability Task is not active");
  }

  if (input.resolutionType === "workout_completion") {
    if (!input.sessionId) {
      throw new Error("sessionId is required for workout completion resolution");
    }
    const { data: session, error: sessionError } = await adminClient
      .from("workout_sessions")
      .select("id, user_id, status")
      .eq("id", input.sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (sessionError || !session || session.status !== "completed") {
      throw new Error("Completed workout session required to resolve Stability Task");
    }
  }

  const gameState = await ensureGameState(adminClient, userId);
  const resolution = resolveStabilityTask({ currentEntropy: Number(gameState.entropy) });
  const nowIso = new Date().toISOString();

  const { error: debuffError } = await adminClient
    .from("debuffs")
    .update({
      status: "resolved",
      resolved_at: nowIso,
      resolution_session_id: input.sessionId ?? null,
    })
    .eq("id", debuffId)
    .eq("user_id", userId);

  if (debuffError) {
    throw debuffError;
  }

  const { error: stateError } = await adminClient
    .from("game_state")
    .update({
      entropy: resolution.entropyAfter,
      status: "active",
      current_debuff_id: null,
    })
    .eq("user_id", userId);

  if (stateError) {
    throw stateError;
  }

  await adminClient.from("game_events").insert({
    user_id: userId,
    event_type: "debuff_resolved",
    source_type: "debuff",
    source_id: debuffId,
    entropy_delta: resolution.entropyDelta,
    metadata: {
      resolutionType: input.resolutionType,
      sessionId: input.sessionId ?? null,
      label: STABILITY_TASK_LABEL,
    },
  });

  return loadStabilitySnapshot(adminClient, userId, nowIso);
}

export function hasNearDeathEffort(
  sets: readonly { rpe_label: string | null; set_type: string; is_completed: boolean }[],
): boolean {
  return sets.some(
    (set) =>
      set.is_completed &&
      set.set_type === "working" &&
      set.rpe_label === "near_death",
  );
}

export { ENTROPY_STABILITY_TASK_THRESHOLD, STABILITY_TASK_DEBUFF_TYPE };
