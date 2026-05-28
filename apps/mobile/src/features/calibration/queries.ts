import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ExerciseCalibrationRow } from "./types";

export const exerciseCalibrationsQueryKey = (userId: string) =>
  ["calibration", "exercise-calibrations", userId] as const;

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

      return (data ?? []) as ExerciseCalibrationRow[];
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

      return (data as ExerciseCalibrationRow | null) ?? null;
    },
  });
}
