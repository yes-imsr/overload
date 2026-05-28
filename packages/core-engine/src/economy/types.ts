export interface PowerCalculationInput {
  readonly totalVolume: number;
  readonly totalWorkingSets: number;
}

export interface PowerCalculationResult {
  readonly basePower: number;
  readonly powerAwarded: number;
}

export interface IdleCreditsInput {
  readonly powerBalance: number;
  readonly idleRate: number;
  readonly lastClaimAtIso: string;
  readonly nowIso: string;
}

export interface IdleCreditsResult {
  readonly elapsedHours: number;
  readonly creditsGenerated: number;
}

export interface ConvertPowerToCreditsInput {
  readonly powerAmount: number;
  readonly idleRate: number;
  readonly elapsedHours: number;
}
