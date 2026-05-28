import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Equipment, Profile } from "@/types/database";
import { buildStarterTemplatePlan } from "./starter-template";
import type {
  Exercise,
  RpeLabel,
  WorkoutSession,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from "./types";

export const builtinExercisesQueryKey = ["workouts", "builtin-exercises"] as const;
export const starterTemplateQueryKey = (userId: string) =>
  ["workouts", "starter-template", userId] as const;
export const workoutSessionsQueryKey = (userId: string) =>
  ["workouts", "sessions", userId] as const;

export function useBuiltinExercises() {
  return useQuery({
    queryKey: builtinExercisesQueryKey,
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<Exercise[]> => {
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }

      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, movement_pattern, equipment_type, is_builtin, calibration_status")
        .eq("is_builtin", true)
        .order("name");

      if (error) {
        throw error;
      }

      return (data ?? []) as Exercise[];
    },
  });
}

export function useStarterTemplate(userId: string | undefined) {
  return useQuery({
    queryKey: starterTemplateQueryKey(userId ?? "none"),
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<{
      template: WorkoutTemplate;
      exercises: WorkoutTemplateExercise[];
    } | null> => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data: templates, error: templateError } = await supabase
        .from("workout_templates")
        .select("id, user_id, name, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (templateError) {
        throw templateError;
      }

      const template = templates?.[0] as WorkoutTemplate | undefined;
      if (!template) {
        return null;
      }

      const { data: rows, error: rowsError } = await supabase
        .from("workout_template_exercises")
        .select(
          "id, template_id, exercise_id, sort_order, target_sets, target_rep_min, target_rep_max, planned_weight, equipment_id, exercise:exercises(id, name, equipment_type, calibration_status)",
        )
        .eq("template_id", template.id)
        .order("sort_order");

      if (rowsError) {
        throw rowsError;
      }

      const exercises = (rows ?? []).map((row) => {
        const exercise = Array.isArray(row.exercise) ? row.exercise[0] : row.exercise;
        if (!exercise) {
          throw new Error("Starter template exercise is missing exercise metadata");
        }
        return {
          ...row,
          exercise,
        } as WorkoutTemplateExercise;
      });

      return {
        template,
        exercises,
      };
    },
  });
}

export function useEnsureStarterTemplate(
  userId: string | undefined,
  profile: Profile | undefined,
  equipment: Equipment[] | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!supabase || !userId || !profile || !equipment) {
        throw new Error("Profile and equipment are required");
      }

      const { data: exercises, error: exercisesError } = await supabase
        .from("exercises")
        .select("id, name, movement_pattern, equipment_type, is_builtin, calibration_status")
        .eq("is_builtin", true);

      if (exercisesError) {
        throw exercisesError;
      }

      const { data: existingTemplates, error: existingError } = await supabase
        .from("workout_templates")
        .select("id, user_id, name, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1);

      if (existingError) {
        throw existingError;
      }

      const existingTemplate = existingTemplates?.[0] as WorkoutTemplate | undefined;
      if (existingTemplate) {
        await queryClient.invalidateQueries({ queryKey: starterTemplateQueryKey(userId) });
        return existingTemplate;
      }

      const equipmentByType = new Map(
        equipment.map((item) => [item.equipment_type, item.id] as const),
      );
      const plan = buildStarterTemplatePlan({
        trainingExperience: profile.training_experience,
        availableEquipmentTypes: equipment.map((item) => item.equipment_type),
        exercises: (exercises ?? []) as Exercise[],
        equipmentByType,
      });

      if (plan.exercises.length === 0) {
        throw new Error("No starter exercises available for your equipment setup");
      }

      const { data: template, error: templateError } = await supabase
        .from("workout_templates")
        .insert({
          user_id: userId,
          name: plan.name,
          status: "active",
        })
        .select("id, user_id, name, status")
        .single();

      if (templateError) {
        throw templateError;
      }

      const { error: rowError } = await supabase.from("workout_template_exercises").insert(
        plan.exercises.map((row) => ({
          template_id: template.id,
          exercise_id: row.exerciseId,
          sort_order: row.sortOrder,
          target_sets: row.targetSets,
          target_rep_min: row.targetRepMin,
          target_rep_max: row.targetRepMax,
          planned_weight: null,
          equipment_id: row.equipmentId,
        })),
      );

      if (rowError) {
        throw rowError;
      }

      await queryClient.invalidateQueries({ queryKey: starterTemplateQueryKey(userId) });
      return template as WorkoutTemplate;
    },
  });
}

export function useStartWorkoutSession(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { templateId: string; clientSessionKey: string }) => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: userId,
          template_id: input.templateId,
          status: "in_progress",
          started_at: new Date().toISOString(),
          client_session_key: input.clientSessionKey,
          source: "mobile",
        })
        .select("id, user_id, template_id, status, started_at, completed_at, client_session_key, total_volume, power_awarded")
        .single();

      if (error) {
        throw error;
      }

      await queryClient.invalidateQueries({ queryKey: workoutSessionsQueryKey(userId) });
      return data as WorkoutSession;
    },
  });
}

export type CompleteWorkoutSetInput = {
  exerciseId: string;
  equipmentId: string | null;
  setOrder: number;
  weight: number;
  reps: number;
  effort: RpeLabel;
  clientSetKey: string;
};

export function useCompleteWorkoutSession(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      sessionId: string;
      clientMutationId: string;
      sets: CompleteWorkoutSetInput[];
    }) => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      if (input.sets.length === 0) {
        throw new Error("At least one set is required to complete a workout");
      }

      const { error: setsError } = await supabase.from("workout_sets").insert(
        input.sets.map((set) => ({
          session_id: input.sessionId,
          user_id: userId,
          exercise_id: set.exerciseId,
          equipment_id: set.equipmentId,
          set_order: set.setOrder,
          set_type: "working",
          weight: set.weight,
          weight_unit: "lb",
          reps: set.reps,
          rpe_label: set.effort,
          is_completed: true,
          completed_at: new Date().toISOString(),
          client_set_key: set.clientSetKey,
        })),
      );

      if (setsError) {
        throw setsError;
      }

      const { data, error } = await supabase.functions.invoke("complete-workout-session", {
        body: {
          sessionId: input.sessionId,
          clientMutationId: input.clientMutationId,
        },
      });

      if (error) {
        throw error;
      }

      await queryClient.invalidateQueries({ queryKey: workoutSessionsQueryKey(userId) });
      return data as {
        sessionId: string;
        totalVolume: number;
        powerAwarded: number;
        status: "completed";
      };
    },
  });
}

export function useCompletedSessions(userId: string | undefined) {
  return useQuery({
    queryKey: workoutSessionsQueryKey(userId ?? "none"),
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<WorkoutSession[]> => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase
        .from("workout_sessions")
        .select("id, user_id, template_id, status, started_at, completed_at, client_session_key, total_volume, power_awarded")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as WorkoutSession[];
    },
  });
}
