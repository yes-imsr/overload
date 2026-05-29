import type { IdleRateCalculationInput } from "./types";

function roundIdleRate(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function calculateIdleRateFromNodes(input: IdleRateCalculationInput): number {
  const totalRate = input.nodes.reduce((total, node) => {
    if (!Number.isFinite(node.baseIdleRate) || node.baseIdleRate < 0) {
      throw new RangeError("baseIdleRate must be a non-negative finite number");
    }
    if (!Number.isInteger(node.level) || node.level < 0) {
      throw new RangeError("level must be a non-negative integer");
    }

    if (!node.isUnlocked || node.level === 0) {
      return total;
    }

    return total + node.baseIdleRate * node.level;
  }, 0);

  return roundIdleRate(totalRate);
}
