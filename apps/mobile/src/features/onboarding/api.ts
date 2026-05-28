import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  EquipmentType,
  OnboardingStatus,
  TrainingExperience,
  WeightUnit,
} from "@/types/supabase";

export type Profile = {
  id: string;
  display_name: string | null;
  training_experience: TrainingExperience;
  height_cm: number | null;
  weight_kg: number | null;
  birth_year: number | null;
  sex: string | null;
  onboarding_status: OnboardingStatus;
};

export type Equipment = {
  id: string;
  user_id: string;
  name: string;
  equipment_type: EquipmentType;
  weight_unit: WeightUnit;
  is_available: boolean;
};

export type SaveProfileInput = {
  userId: string;
  displayName: string;
  trainingExperience: TrainingExperience;
};

export type SaveEquipmentInput = {
  userId: string;
  selectedEquipmentKeys: string[];
  weightUnit: WeightUnit;
  options: {
    key: string;
    name: string;
    equipmentType: EquipmentType;
  }[];
};

export const profileQueryKey = (userId?: string) =>
  ["profile", userId] as const;

export const equipmentQueryKey = (userId?: string) =>
  ["equipment", userId] as const;

const profileColumns =
  "id, display_name, training_experience, height_cm, weight_kg, birth_year, sex, onboarding_status";

const equipmentColumns =
  "id, user_id, name, equipment_type, weight_unit, is_available";

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured for this build.");
  }

  return supabase;
}

export function useProfileQuery(userId?: string) {
  return useQuery({
    queryKey: profileQueryKey(userId),
    enabled: Boolean(supabase && userId),
    queryFn: async () => {
      const client = requireSupabase();
      const { data, error } = await client
        .from("profiles")
        .select(profileColumns)
        .eq("id", userId ?? "")
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as Profile | null;
    },
  });
}

export function useEquipmentQuery(userId?: string) {
  return useQuery({
    queryKey: equipmentQueryKey(userId),
    enabled: Boolean(supabase && userId),
    queryFn: async () => {
      const client = requireSupabase();
      const { data, error } = await client
        .from("equipment")
        .select(equipmentColumns)
        .eq("user_id", userId ?? "")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as Equipment[];
    },
  });
}

export function useSaveProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveProfileInput) => {
      const client = requireSupabase();
      const { data, error } = await client
        .from("profiles")
        .upsert(
          {
            id: input.userId,
            display_name: input.displayName.trim(),
            training_experience: input.trainingExperience,
            onboarding_status: "profile_complete",
          },
          { onConflict: "id" },
        )
        .select(profileColumns)
        .single();

      if (error) {
        throw error;
      }

      return data as Profile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey(profile.id), profile);
    },
  });
}

export function useSaveEquipmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveEquipmentInput) => {
      const client = requireSupabase();
      const selected = new Set(input.selectedEquipmentKeys);
      const { data: existingRows, error: existingError } = await client
        .from("equipment")
        .select(equipmentColumns)
        .eq("user_id", input.userId);

      if (existingError) {
        throw existingError;
      }

      const existingByName = new Map(
        (existingRows ?? []).map((row) => [row.name.toLowerCase(), row]),
      );

      for (const option of input.options) {
        const existing = existingByName.get(option.name.toLowerCase());
        const isAvailable = selected.has(option.key);

        if (existing) {
          const { error } = await client
            .from("equipment")
            .update({
              equipment_type: option.equipmentType,
              weight_unit: input.weightUnit,
              is_available: isAvailable,
            })
            .eq("id", existing.id);

          if (error) {
            throw error;
          }
        } else {
          const { error } = await client.from("equipment").insert({
            user_id: input.userId,
            name: option.name,
            equipment_type: option.equipmentType,
            weight_unit: input.weightUnit,
            is_available: isAvailable,
          });

          if (error) {
            throw error;
          }
        }
      }

      const { data: profile, error: profileError } = await client
        .from("profiles")
        .update({ onboarding_status: "complete" })
        .eq("id", input.userId)
        .select(profileColumns)
        .single();

      if (profileError) {
        throw profileError;
      }

      const { data: equipment, error: equipmentError } = await client
        .from("equipment")
        .select(equipmentColumns)
        .eq("user_id", input.userId)
        .order("name", { ascending: true });

      if (equipmentError) {
        throw equipmentError;
      }

      return {
        profile: profile as Profile,
        equipment: (equipment ?? []) as Equipment[],
      };
    },
    onSuccess: ({ profile, equipment }) => {
      queryClient.setQueryData(profileQueryKey(profile.id), profile);
      queryClient.setQueryData(equipmentQueryKey(profile.id), equipment);
    },
  });
}
