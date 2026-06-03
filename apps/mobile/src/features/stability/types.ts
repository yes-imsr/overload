export type StabilityDebuffSnapshot = {
  id: string;
  debuffType: string;
  status: "pending_reveal" | "active" | "resolved" | "expired";
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
  gameStatus: "active" | "prestige_locked" | "debuffed";
  debuff: StabilityDebuffSnapshot | null;
  canReveal: boolean;
  canResolve: boolean;
};
