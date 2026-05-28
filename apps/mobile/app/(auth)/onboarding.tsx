import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryCTAButton, SystemState } from "@/components";
import {
  useEquipmentQuery,
  useProfileQuery,
  useSaveEquipmentMutation,
  useSaveProfileMutation,
} from "@/features/onboarding/api";
import {
  equipmentOptions,
  trainingExperienceOptions,
  weightUnitOptions,
} from "@/features/onboarding/options";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { colors, radius, spacing, typography } from "@/tokens";
import { TrainingExperience, WeightUnit } from "@/types/supabase";

type AuthMode = "signIn" | "signUp";

export default function OnboardingRoute() {
  const { isConfigured, isLoading: isAuthLoading, user } = useAuth();
  const profileQuery = useProfileQuery(user?.id);
  const equipmentQuery = useEquipmentQuery(user?.id);
  const saveProfileMutation = useSaveProfileMutation();
  const saveEquipmentMutation = useSaveEquipmentMutation();

  const [authMode, setAuthMode] = useState<AuthMode>("signUp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [trainingExperience, setTrainingExperience] =
    useState<TrainingExperience>("new");
  const [profileError, setProfileError] = useState<string | null>(null);

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    "bodyweight",
  ]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lb");
  const [equipmentError, setEquipmentError] = useState<string | null>(null);

  const profile = profileQuery.data;
  const equipment = equipmentQuery.data ?? [];
  const hasProfileStep =
    profile?.onboarding_status === "profile_complete" ||
    profile?.onboarding_status === "equipment_complete" ||
    profile?.onboarding_status === "calibration_started" ||
    profile?.onboarding_status === "complete";
  const isOnboardingComplete = profile?.onboarding_status === "complete";

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }

    if (profile?.training_experience) {
      setTrainingExperience(profile.training_experience);
    }
  }, [profile?.display_name, profile?.training_experience]);

  useEffect(() => {
    if (equipment.length === 0) {
      return;
    }

    const selectedKeys = equipment
      .filter((row) => row.is_available)
      .map((row) => {
        const option = equipmentOptions.find(
          (candidate) =>
            candidate.name.toLowerCase() === row.name.toLowerCase(),
        );
        return option?.key;
      })
      .filter((key): key is string => Boolean(key));

    if (selectedKeys.length > 0) {
      setSelectedEquipment(selectedKeys);
    }

    const firstUnit = equipment.find((row) => row.weight_unit)?.weight_unit;
    if (firstUnit) {
      setWeightUnit(firstUnit);
    }
  }, [equipment]);

  useEffect(() => {
    if (isOnboardingComplete) {
      router.replace("/home");
    }
  }, [isOnboardingComplete]);

  const progressLabel = useMemo(() => {
    if (!user) {
      return "01 / Auth";
    }

    if (!hasProfileStep) {
      return "02 / Profile";
    }

    return "03 / Equipment";
  }, [hasProfileStep, user]);

  if (!isConfigured) {
    return (
      <SystemState
        eyebrow="Supabase offline"
        title="Backend link required"
        body="Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY before account entry can run."
      />
    );
  }

  if (isAuthLoading || (user && (profileQuery.isLoading || equipmentQuery.isLoading))) {
    return (
      <SystemState
        eyebrow="Operator intake"
        title="Reading saved onboarding state"
        loading
      />
    );
  }

  if (profileQuery.isError || equipmentQuery.isError) {
    return (
      <SystemState
        eyebrow="Operator intake"
        title="Onboarding state blocked"
        body="The app could not read your profile or equipment through Supabase. Check your session and RLS access before continuing."
      />
    );
  }

  async function submitAuth() {
    if (!supabase) {
      return;
    }

    setAuthError(null);
    setAuthMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || password.length < 6) {
      setAuthError("Enter an email and a password with at least 6 characters.");
      return;
    }

    const result =
      authMode === "signUp"
        ? await supabase.auth.signUp({
            email: normalizedEmail,
            password,
          })
        : await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

    if (result.error) {
      setAuthError(result.error.message);
      return;
    }

    if (authMode === "signUp" && !result.data.session) {
      setAuthMessage(
        "Account created. Confirm your email if required, then sign in to continue setup.",
      );
      setAuthMode("signIn");
      return;
    }

    setAuthMessage("Session established. Loading operator setup.");
  }

  async function submitProfile() {
    setProfileError(null);

    if (!user) {
      setProfileError("Sign in before saving a training profile.");
      return;
    }

    if (!displayName.trim()) {
      setProfileError("Enter the name this console should use.");
      return;
    }

    try {
      await saveProfileMutation.mutateAsync({
        userId: user.id,
        displayName,
        trainingExperience,
      });
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Profile save failed through Supabase.",
      );
    }
  }

  async function submitEquipment() {
    setEquipmentError(null);

    if (!user) {
      setEquipmentError("Sign in before saving equipment.");
      return;
    }

    if (selectedEquipment.length === 0) {
      setEquipmentError("Select at least one training option.");
      return;
    }

    try {
      await saveEquipmentMutation.mutateAsync({
        userId: user.id,
        selectedEquipmentKeys: selectedEquipment,
        weightUnit,
        options: equipmentOptions,
      });
      router.replace("/home");
    } catch (error) {
      setEquipmentError(
        error instanceof Error
          ? error.message
          : "Equipment save failed through Supabase.",
      );
    }
  }

  function toggleEquipment(key: string) {
    setSelectedEquipment((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Operator intake</Text>
            <Text style={styles.title}>Build the training console.</Text>
            <Text style={styles.subtitle}>
              Account first. Profile second. Equipment third. No imports, no
              wearables, no social graph.
            </Text>
          </View>

          <View style={styles.progressPanel}>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
            <Text style={styles.progressBody}>
              Saved progress resumes from Supabase if setup is interrupted.
            </Text>
          </View>

          {!user ? (
            <View style={styles.panel}>
              <View style={styles.modeRow}>
                <SegmentButton
                  label="Create account"
                  selected={authMode === "signUp"}
                  onPress={() => setAuthMode("signUp")}
                />
                <SegmentButton
                  label="Sign in"
                  selected={authMode === "signIn"}
                  onPress={() => setAuthMode("signIn")}
                />
              </View>
              <FieldLabel label="Email" />
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="operator@overload.local"
                placeholderTextColor={colors.text.muted}
                style={styles.input}
                value={email}
              />
              <FieldLabel label="Password" />
              <TextInput
                autoCapitalize="none"
                onChangeText={setPassword}
                placeholder="Minimum 6 characters"
                placeholderTextColor={colors.text.muted}
                secureTextEntry
                style={styles.input}
                value={password}
              />
              {authError ? <Text style={styles.error}>{authError}</Text> : null}
              {authMessage ? (
                <Text style={styles.success}>{authMessage}</Text>
              ) : null}
              <PrimaryCTAButton
                label={
                  authMode === "signUp"
                    ? "Create account"
                    : "Open existing console"
                }
                loading={false}
                onPress={submitAuth}
                variant="success"
              />
            </View>
          ) : !hasProfileStep ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Training profile</Text>
              <Text style={styles.panelBody}>
                Keep it lean: name the console and set the experience band used
                to frame MVP workout setup.
              </Text>
              <FieldLabel label="Display name" />
              <TextInput
                onChangeText={setDisplayName}
                placeholder="Operator name"
                placeholderTextColor={colors.text.muted}
                style={styles.input}
                value={displayName}
              />
              <FieldLabel label="Training experience" />
              <View style={styles.optionStack}>
                {trainingExperienceOptions.map((option) => (
                  <SelectableCard
                    key={option.value}
                    title={option.label}
                    body={option.description}
                    selected={trainingExperience === option.value}
                    onPress={() => setTrainingExperience(option.value)}
                  />
                ))}
              </View>
              {profileError ? (
                <Text style={styles.error}>{profileError}</Text>
              ) : null}
              <PrimaryCTAButton
                label="Save profile"
                loading={saveProfileMutation.isPending}
                onPress={submitProfile}
                variant="success"
              />
            </View>
          ) : (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Equipment setup</Text>
              <Text style={styles.panelBody}>
                Select what is available for MVP workout logging. This only
                writes your owned equipment rows.
              </Text>
              <FieldLabel label="Default load unit" />
              <View style={styles.modeRow}>
                {weightUnitOptions.map((option) => (
                  <SegmentButton
                    key={option.value}
                    label={option.label}
                    selected={weightUnit === option.value}
                    onPress={() => setWeightUnit(option.value)}
                  />
                ))}
              </View>
              <FieldLabel label="Available equipment" />
              <View style={styles.optionStack}>
                {equipmentOptions.map((option) => (
                  <SelectableCard
                    key={option.key}
                    title={option.name}
                    body={option.description}
                    selected={selectedEquipment.includes(option.key)}
                    onPress={() => toggleEquipment(option.key)}
                  />
                ))}
              </View>
              {equipmentError ? (
                <Text style={styles.error}>{equipmentError}</Text>
              ) : null}
              <PrimaryCTAButton
                label="Enter main console"
                loading={saveEquipmentMutation.isPending}
                onPress={submitEquipment}
                variant="credits"
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldLabelProps = {
  label: string;
};

function FieldLabel({ label }: FieldLabelProps) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

type SegmentButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function SegmentButton({ label, selected, onPress }: SegmentButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
    >
      <Text
        style={[
          styles.segmentText,
          selected && styles.segmentTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type SelectableCardProps = {
  title: string;
  body: string;
  selected: boolean;
  onPress: () => void;
};

function SelectableCard({ title, body, selected, onPress }: SelectableCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.optionCard, selected && styles.optionCardSelected]}
    >
      <View style={styles.optionHeader}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={[styles.optionStatus, selected && styles.optionStatusOn]}>
          {selected ? "Selected" : "Available"}
        </Text>
      </View>
      <Text style={styles.optionBody}>{body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.label,
    color: colors.accent.power,
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  progressPanel: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: radius.md,
    backgroundColor: colors.background.surface,
    padding: spacing.md,
  },
  progressLabel: {
    ...typography.mono,
    color: colors.accent.success,
  },
  progressBody: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  panel: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background.elevated,
    padding: spacing.lg,
  },
  panelTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  panelBody: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  modeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: radius.sm,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  segmentButtonSelected: {
    borderColor: colors.accent.success,
    backgroundColor: colors.background.surface,
  },
  segmentText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  segmentTextSelected: {
    color: colors.text.primary,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text.secondary,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: radius.md,
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  optionStack: {
    gap: spacing.sm,
  },
  optionCard: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: radius.md,
    backgroundColor: colors.background.primary,
    padding: spacing.md,
  },
  optionCardSelected: {
    borderColor: colors.accent.success,
    backgroundColor: colors.background.surface,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  optionTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  optionStatus: {
    ...typography.label,
    color: colors.text.muted,
  },
  optionStatusOn: {
    color: colors.accent.success,
  },
  optionBody: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
  success: {
    ...typography.caption,
    color: colors.accent.success,
  },
});
