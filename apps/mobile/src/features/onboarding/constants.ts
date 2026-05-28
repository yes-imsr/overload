import type { EquipmentType, TrainingExperience } from "@/types/database";

export const TRAINING_EXPERIENCE_OPTIONS: {
  value: TrainingExperience;
  label: string;
  description: string;
}[] = [
  {
    value: "new",
    label: "New",
    description: "Under one year of consistent lifting",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Solid base, ready for structured load",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "High training literacy and volume tolerance",
  },
];

export type EquipmentPreset = {
  key: string;
  name: string;
  equipment_type: EquipmentType;
};

export const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  { key: "barbell", name: "Barbell", equipment_type: "barbell" },
  { key: "dumbbell", name: "Dumbbells", equipment_type: "dumbbell" },
  { key: "machine", name: "Machines", equipment_type: "machine" },
  { key: "cable", name: "Cable stack", equipment_type: "cable" },
  { key: "bodyweight", name: "Bodyweight", equipment_type: "bodyweight" },
];
