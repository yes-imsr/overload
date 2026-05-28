import type { EquipmentType, TrainingExperience } from "@/types/database";

export type RpeLabel = "easy" | "medium" | "hard" | "near_death";

export type WorkoutSessionStatus =
  | "draft"
  | "in_progress"
  | "completed"
  | "abandoned"
  | "corrected";

export type Exercise = {
  id: string;
  name: string;
  movement_pattern: string | null;
  equipment_type: EquipmentType | null;
  is_builtin: boolean;
  calibration_status: "uncalibrated" | "provisional" | "calibrated";
};

export type WorkoutTemplate = {
  id: string;
  user_id: string;
  name: string;
  status: "draft" | "active" | "archived";
};

export type WorkoutTemplateExercise = {
  id: string;
  template_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  target_rep_min: number;
  target_rep_max: number;
  planned_weight: number | null;
  equipment_id: string | null;
  exercise: Pick<Exercise, "id" | "name" | "equipment_type" | "calibration_status">;
};

export type WorkoutSession = {
  id: string;
  user_id: string;
  template_id: string | null;
  status: WorkoutSessionStatus;
  started_at: string | null;
  completed_at: string | null;
  client_session_key: string | null;
  total_volume: number | null;
  power_awarded: number | null;
};

export type StarterTemplatePlan = {
  name: string;
  exercises: Array<{
    exerciseId: string;
    sortOrder: number;
    targetSets: number;
    targetRepMin: number;
    targetRepMax: number;
    equipmentId: string | null;
  }>;
};

export type StarterTemplateInput = {
  trainingExperience: TrainingExperience;
  availableEquipmentTypes: EquipmentType[];
  exercises: Exercise[];
  equipmentByType: Map<EquipmentType, string>;
};

export const EFFORT_TO_RPE_LABEL: Record<string, RpeLabel> = {
  Easy: "easy",
  Medium: "medium",
  Hard: "hard",
  "Near Death": "near_death",
};

export const RPE_LABEL_TO_EFFORT: Record<RpeLabel, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  near_death: "Near Death",
};
