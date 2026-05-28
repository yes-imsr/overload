import type { EquipmentType } from "@/types/database";
import type { Exercise, StarterTemplateInput, StarterTemplatePlan } from "./types";

const PATTERN_PRIORITY = ["squat", "push", "pull", "hinge", "core"] as const;

function setsForExperience(experience: StarterTemplateInput["trainingExperience"]): number {
  switch (experience) {
    case "new":
      return 3;
    case "intermediate":
      return 3;
    case "advanced":
      return 4;
    default:
      return 3;
  }
}

function repRangeForExperience(experience: StarterTemplateInput["trainingExperience"]): {
  min: number;
  max: number;
} {
  if (experience === "new") {
    return { min: 8, max: 10 };
  }
  if (experience === "intermediate") {
    return { min: 6, max: 8 };
  }
  return { min: 5, max: 8 };
}

function exerciseCountForExperience(
  experience: StarterTemplateInput["trainingExperience"],
): number {
  return experience === "new" ? 3 : 4;
}

function resolveEquipmentTypes(availableEquipmentTypes: EquipmentType[]): EquipmentType[] {
  if (availableEquipmentTypes.length > 0) {
    return availableEquipmentTypes;
  }
  return ["barbell"];
}

export function buildStarterTemplatePlan(input: StarterTemplateInput): StarterTemplatePlan {
  const equipmentTypes = resolveEquipmentTypes(input.availableEquipmentTypes);
  const matchingExercises = input.exercises.filter(
    (exercise) =>
      exercise.is_builtin &&
      exercise.equipment_type !== null &&
      equipmentTypes.includes(exercise.equipment_type),
  );

  const selected: Exercise[] = [];
  for (const pattern of PATTERN_PRIORITY) {
    const match = matchingExercises.find(
      (exercise) => exercise.movement_pattern === pattern && !selected.some((s) => s.id === exercise.id),
    );
    if (match) {
      selected.push(match);
    }
    if (selected.length >= exerciseCountForExperience(input.trainingExperience)) {
      break;
    }
  }

  for (const exercise of matchingExercises) {
    if (selected.length >= exerciseCountForExperience(input.trainingExperience)) {
      break;
    }
    if (!selected.some((entry) => entry.id === exercise.id)) {
      selected.push(exercise);
    }
  }

  const repRange = repRangeForExperience(input.trainingExperience);
  const targetSets = setsForExperience(input.trainingExperience);

  return {
    name: "Starter Session",
    exercises: selected.map((exercise, index) => ({
      exerciseId: exercise.id,
      sortOrder: index + 1,
      targetSets,
      targetRepMin: repRange.min,
      targetRepMax: repRange.max,
      equipmentId:
        exercise.equipment_type !== null
          ? (input.equipmentByType.get(exercise.equipment_type) ?? null)
          : null,
    })),
  };
}

export function templateDisplaySummary(plan: StarterTemplatePlan, exerciseNames: Map<string, string>): string {
  const names = plan.exercises
    .map((row) => exerciseNames.get(row.exerciseId) ?? "Exercise")
    .join(" · ");
  return names;
}
