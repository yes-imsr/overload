import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryCTAButton } from "@/components";
import { FormField } from "@/components/FormField";
import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionChip } from "@/components/OptionChip";
import { TRAINING_EXPERIENCE_OPTIONS } from "@/features/onboarding/constants";
import {
  useAuthSession,
  useProfile,
  useSaveTrainingProfile,
} from "@/features/onboarding/queries";
import type { TrainingExperience } from "@/types/database";
import { colors, spacing, typography } from "@/tokens";

export default function TrainingProfileScreen() {
  const sessionQuery = useAuthSession();
  const userId = sessionQuery.data?.user.id;
  const profileQuery = useProfile(userId);
  const saveProfile = useSaveTrainingProfile(userId);

  const [displayName, setDisplayName] = useState("");
  const [experience, setExperience] = useState<TrainingExperience>("new");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }
    setDisplayName(profileQuery.data.display_name ?? "");
    setExperience(profileQuery.data.training_experience);
  }, [profileQuery.data]);

  const submit = async () => {
    if (!displayName.trim()) {
      setError("Enter an operator name.");
      return;
    }

    setError(null);

    try {
      await saveProfile.mutateAsync({
        displayName,
        trainingExperience: experience,
      });
      router.replace("/equipment");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not save profile.";
      setError(message);
    }
  };

  return (
    <OnboardingShell
      eyebrow="Training profile"
      title="The system needs your starting constraints."
      body="Set experience level for progression calibration. No wearables, nutrition, or social import."
      step="01 / 02"
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryCTAButton
            label="Build Training Profile"
            variant="success"
            loading={saveProfile.isPending || profileQuery.isLoading}
            onPress={submit}
          />
        </>
      }
    >
      <FormField
        label="Operator name"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
        placeholder="Display name"
      />

      <View style={styles.stack}>
        {TRAINING_EXPERIENCE_OPTIONS.map((option) => (
          <OptionChip
            key={option.value}
            label={option.label}
            description={option.description}
            selected={experience === option.value}
            onPress={() => setExperience(option.value)}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
});
