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

export type GameStatus = "active" | "prestige_locked" | "debuffed";

export type GameState = {
  user_id: string;
  power_balance: number;
  credits_balance: number;
  entropy: number;
  prestige_level: number;
  idle_rate: number;
  current_debuff_id: string | null;
  status: GameStatus;
};

export type StabilityTaskStatus = "pending_reveal" | "active" | "resolved" | "expired";

export type StabilityTaskDebuff = {
  id: string;
  user_id: string;
  debuff_type: "power_gain_reduction";
  status: StabilityTaskStatus;
  assigned_at: string;
  revealed_at: string | null;
  resolved_at: string | null;
  effect_value: number;
};
