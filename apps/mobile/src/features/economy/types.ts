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
