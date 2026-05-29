export type TrainingExperience = "new" | "intermediate" | "advanced";

export type OnboardingStatus =
  | "not_started"
  | "profile_complete"
  | "equipment_complete"
  | "calibration_started"
  | "complete";

export type EquipmentType =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "other";

export type Profile = {
  id: string;
  display_name: string | null;
  training_experience: TrainingExperience;
  onboarding_status: OnboardingStatus;
};

export type Equipment = {
  id: string;
  user_id: string;
  name: string;
  equipment_type: EquipmentType;
  weight_unit: "lb" | "kg";
  is_available: boolean;
};

export type GameState = {
  user_id: string;
  power_balance: number | string;
  credits_balance: number | string;
  entropy: number | string;
  prestige_level: number;
  idle_rate: number | string;
  last_idle_claim_at: string | null;
  status: "active" | "prestige_locked" | "debuffed";
  created_at?: string | null;
  updated_at?: string | null;
};

export type EconomyNode = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  unlock_credits_cost: number | string;
  base_idle_rate: number | string;
  max_level: number;
  is_active: boolean;
};

export type UserNode = {
  id: string;
  user_id: string;
  node_id: string;
  level: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
};
