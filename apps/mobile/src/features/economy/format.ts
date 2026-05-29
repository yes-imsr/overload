const NODE_BLOCK_LABELS: Record<string, string> = {
  already_unlocked: "Already online",
  prerequisite_locked: "Prior node required",
  insufficient_credits: "Insufficient Credits",
};

export function formatBalance(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(2);
}

export function formatCreditsRate(creditsPerHour: number): string {
  return `${formatBalance(creditsPerHour)}/h`;
}

export function formatNodeBlockReason(reasonCode: string | null): string | null {
  if (!reasonCode) {
    return null;
  }
  return NODE_BLOCK_LABELS[reasonCode] ?? reasonCode;
}

export function formatNodeCost(cost: number): string {
  if (cost <= 0) {
    return "Starter";
  }
  return `${formatBalance(cost)} Credits`;
}
