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
