import {
  EquipmentType,
  TrainingExperience,
  WeightUnit,
} from "@/types/supabase";

export type TrainingExperienceOption = {
  value: TrainingExperience;
  label: string;
  description: string;
};

export type EquipmentOption = {
  key: string;
  name: string;
  equipmentType: EquipmentType;
  description: string;
};

export const trainingExperienceOptions: TrainingExperienceOption[] = [
  {
    value: "new",
    label: "New lifter",
    description: "Learning movement patterns and baseline loading.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Consistent training history with repeatable working sets.",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Experienced with heavy loading and structured progression.",
  },
];

export const equipmentOptions: EquipmentOption[] = [
  {
    key: "bodyweight",
    name: "Bodyweight",
    equipmentType: "bodyweight",
    description: "No external load required.",
  },
  {
    key: "barbell",
    name: "Barbell",
    equipmentType: "barbell",
    description: "Rack, plates, and standard barbell work.",
  },
  {
    key: "dumbbells",
    name: "Dumbbells",
    equipmentType: "dumbbell",
    description: "Fixed or adjustable dumbbells.",
  },
  {
    key: "cables",
    name: "Cable station",
    equipmentType: "cable",
    description: "Cable stack or functional trainer.",
  },
  {
    key: "machines",
    name: "Machines",
    equipmentType: "machine",
    description: "Selectorized or plate-loaded machines.",
  },
];

export const weightUnitOptions: { value: WeightUnit; label: string }[] = [
  { value: "lb", label: "LB" },
  { value: "kg", label: "KG" },
];
