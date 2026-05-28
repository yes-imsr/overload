import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  Equipment,
  OnboardingStatus,
  Profile,
  TrainingExperience,
} from "@/types/database";
import { EQUIPMENT_PRESETS } from "./constants";

export const authSessionQueryKey = ["auth", "session"] as const;
export const profileQueryKey = (userId: string) => ["profile", userId] as const;
export const equipmentQueryKey = (userId: string) => ["equipment", userId] as const;

export function useAuthSession() {
  return useQuery({
    queryKey: authSessionQueryKey,
    enabled: isSupabaseConfigured(),
    queryFn: async () => {
      if (!supabase) {
        return null;
      }
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      return data.session;
    },
    staleTime: 60_000,
  });
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileQueryKey(userId ?? "none"),
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<Profile> => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, training_experience, onboarding_status")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      return data as Profile;
    },
  });
}

export function useEquipment(userId: string | undefined) {
  return useQuery({
    queryKey: equipmentQueryKey(userId ?? "none"),
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<Equipment[]> => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data, error } = await supabase
        .from("equipment")
        .select("id, user_id, name, equipment_type, weight_unit, is_available")
        .eq("user_id", userId)
        .eq("is_available", true);

      if (error) {
        throw error;
      }

      return (data ?? []) as Equipment[];
    },
  });
}

export function useSaveTrainingProfile(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      displayName: string;
      trainingExperience: TrainingExperience;
    }) => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: input.displayName.trim(),
          training_experience: input.trainingExperience,
          onboarding_status: "profile_complete" satisfies OnboardingStatus,
        })
        .eq("id", userId);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      if (userId) {
        await queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) });
      }
    },
  });
}

export function useSaveEquipmentSelection(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (selectedKeys: Set<string>) => {
      if (!supabase || !userId) {
        throw new Error("Supabase session required");
      }

      const { data: existing, error: fetchError } = await supabase
        .from("equipment")
        .select("id, name, equipment_type, is_available")
        .eq("user_id", userId);

      if (fetchError) {
        throw fetchError;
      }

      const existingRows = existing ?? [];
      const selectedPresets = EQUIPMENT_PRESETS.filter((preset) =>
        selectedKeys.has(preset.key),
      );

      if (selectedPresets.length === 0) {
        throw new Error("Select at least one equipment option.");
      }

      for (const preset of selectedPresets) {
        const match = existingRows.find(
          (row) => row.name.toLowerCase() === preset.name.toLowerCase(),
        );

        if (match) {
          const { error } = await supabase
            .from("equipment")
            .update({ is_available: true, equipment_type: preset.equipment_type })
            .eq("id", match.id);

          if (error) {
            throw error;
          }
          continue;
        }

        const { error } = await supabase.from("equipment").insert({
          user_id: userId,
          name: preset.name,
          equipment_type: preset.equipment_type,
          weight_unit: "lb",
          is_available: true,
        });

        if (error) {
          throw error;
        }
      }

      for (const row of existingRows) {
        const preset = EQUIPMENT_PRESETS.find(
          (item) => item.name.toLowerCase() === row.name.toLowerCase(),
        );
        if (!preset || selectedKeys.has(preset.key)) {
          continue;
        }

        const { error } = await supabase
          .from("equipment")
          .update({ is_available: false })
          .eq("id", row.id);

        if (error) {
          throw error;
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_status: "equipment_complete" satisfies OnboardingStatus })
        .eq("id", userId);

      if (profileError) {
        throw profileError;
      }
    },
    onSuccess: async () => {
      if (!userId) {
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: equipmentQueryKey(userId) }),
        queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) }),
      ]);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
      queryClient.clear();
    },
  });
}
