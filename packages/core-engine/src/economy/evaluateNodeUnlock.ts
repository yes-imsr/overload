export interface NodeUnlockEvaluationInput {
  readonly creditsBalance: number;
  readonly unlockCreditsCost: number;
  readonly isAlreadyUnlocked: boolean;
  readonly prerequisiteUnlocked: boolean;
}

export type NodeUnlockBlockReason =
  | "already_unlocked"
  | "prerequisite_locked"
  | "insufficient_credits";

export type NodeUnlockEvaluationResult =
  | { readonly allowed: true; readonly creditCost: number }
  | { readonly allowed: false; readonly reasonCode: NodeUnlockBlockReason };

export function evaluateNodeUnlock(
  input: NodeUnlockEvaluationInput,
): NodeUnlockEvaluationResult {
  if (input.isAlreadyUnlocked) {
    return { allowed: false, reasonCode: "already_unlocked" };
  }

  if (!input.prerequisiteUnlocked) {
    return { allowed: false, reasonCode: "prerequisite_locked" };
  }

  const creditCost = input.unlockCreditsCost;
  if (!Number.isFinite(creditCost) || creditCost < 0) {
    throw new RangeError("unlockCreditsCost must be a non-negative finite number");
  }

  if (input.creditsBalance < creditCost) {
    return { allowed: false, reasonCode: "insufficient_credits" };
  }

  return { allowed: true, creditCost };
}
