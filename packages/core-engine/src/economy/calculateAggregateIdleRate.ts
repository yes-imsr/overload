export interface EconomyNodeContribution {
  readonly isUnlocked: boolean;
  readonly level: number;
  readonly baseIdleRate: number;
}

export function calculateAggregateIdleRate(
  nodes: readonly EconomyNodeContribution[],
): number {
  return nodes.reduce((total, node) => {
    if (!node.isUnlocked || node.level < 1) {
      return total;
    }
    if (!Number.isFinite(node.baseIdleRate) || node.baseIdleRate < 0) {
      throw new RangeError("baseIdleRate must be a non-negative finite number");
    }
    return total + node.baseIdleRate;
  }, 0);
}
