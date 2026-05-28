export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OnboardingStatus =
  | "not_started"
  | "profile_complete"
  | "equipment_complete"
  | "calibration_started"
  | "complete";

export type TrainingExperience = "new" | "intermediate" | "advanced";

export type Sex = "male" | "female" | "other" | "prefer_not_to_say";

export type EquipmentType =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "other";

export type WeightUnit = "lb" | "kg";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          training_experience: TrainingExperience;
          height_cm: number | null;
          weight_kg: number | null;
          birth_year: number | null;
          sex: Sex | null;
          onboarding_status: OnboardingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          training_experience?: TrainingExperience;
          height_cm?: number | null;
          weight_kg?: number | null;
          birth_year?: number | null;
          sex?: Sex | null;
          onboarding_status?: OnboardingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          training_experience?: TrainingExperience;
          height_cm?: number | null;
          weight_kg?: number | null;
          birth_year?: number | null;
          sex?: Sex | null;
          onboarding_status?: OnboardingStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      equipment: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          equipment_type: EquipmentType;
          weight_unit: WeightUnit;
          min_weight: number | null;
          max_weight: number | null;
          increment: number | null;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          equipment_type: EquipmentType;
          weight_unit?: WeightUnit;
          min_weight?: number | null;
          max_weight?: number | null;
          increment?: number | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          equipment_type?: EquipmentType;
          weight_unit?: WeightUnit;
          min_weight?: number | null;
          max_weight?: number | null;
          increment?: number | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
