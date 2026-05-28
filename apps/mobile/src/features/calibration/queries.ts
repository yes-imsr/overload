import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ExerciseCalibrationRow } from "./types";

export const exerciseCalibrationsQueryKey = (userId: string) =>
  ["calibration", "exercise-calibrations", userId] as const;

type CalibrationExerciseRelation = ExerciseCalibrationRow["exercise"];

type RawExerciseCalibrationRow = Omit<ExerciseCalibrationRow, "exercise"> & {
  exercise: CalibrationExerciseRelation | CalibrationExerciseRelation[] | null;
};

function resolveCalibrationExercise(
  relation: RawExerciseCalibrationRow["exercise"],
): CalibrationExerciseRelation | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function toExerciseCalibrationRow(
  row: RawExerciseCalibrationRow,
): ExerciseCalibrationRow | null {
  const exercise = resolveCalibrationExercise(row.exercise);

  if (!exercise) {
    return null;
  }

  return {
    ...row,
    exercise,
  };
}

export function useExerciseCalibrations(userId: string | undefined) {
  return useQuery({
    queryKey: exerciseCalibrationsQueryKey(userId ?? "none"),
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<ExerciseCalibrationRow[]> => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase
        .from("exercise_calibrations")
        .select(
          "id, user_id, exercise_id, calibration_status, calibrated_at, last_session_at, exercise:exercises(id, name)",
        )
        .eq("user_id", userId)
        .order("last_session_at", { ascending: false, nullsFirst: false });

      if (error) {
        throw error;
      }

      return ((data ?? []) as unknown as RawExerciseCalibrationRow[])
        .map(toExerciseCalibrationRow)
        .filter((row): row is ExerciseCalibrationRow => row !== null);
    },
  });
}

export function useExerciseCalibration(
  userId: string | undefined,
  exerciseId: string | undefined,
) {
  return useQuery({
    queryKey: [...exerciseCalibrationsQueryKey(userId ?? "none"), exerciseId ?? "none"],
    enabled: Boolean(supabase && userId && exerciseId),
    queryFn: async (): Promise<ExerciseCalibrationRow | null> => {
      if (!supabase || !userId || !exerciseId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase
        .from("exercise_calibrations")
        .select(
          "id, user_id, exercise_id, calibration_status, calibrated_at, last_session_at, exercise:exercises(id, name)",
        )
        .eq("user_id", userId)
        .eq("exercise_id", exerciseId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data
        ? toExerciseCalibrationRow(data as unknown as RawExerciseCalibrationRow)
        : null;
    },
  });
}
