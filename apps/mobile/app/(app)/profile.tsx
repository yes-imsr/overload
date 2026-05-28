import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryCTAButton } from "@/components";
import { useEquipmentQuery, useProfileQuery } from "@/features/onboarding/api";
import { useAuth } from "@/providers/auth-provider";
import { ScreenShell } from "@/screens/ScreenShell";
import { colors, spacing, typography } from "@/tokens";

export default function ProfileRoute() {
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();
  const profileQuery = useProfileQuery(user?.id);
  const equipmentQuery = useEquipmentQuery(user?.id);
  const profile = profileQuery.data;
  const activeEquipment =
    equipmentQuery.data?.filter((item) => item.is_available) ?? [];

  async function handleSignOut() {
    await signOut();
    queryClient.clear();
    router.replace("/onboarding");
  }

  return (
    <ScreenShell
      title="Profile terminal"
      subtitle="Supabase-owned operator context."
    >
      <View style={styles.panel}>
        <Text style={styles.label}>Display name</Text>
        <Text style={styles.value}>{profile?.display_name ?? "Unset"}</Text>
        <Text style={styles.label}>Training experience</Text>
        <Text style={styles.value}>
          {profile?.training_experience ?? "Unset"}
        </Text>
        <Text style={styles.label}>Onboarding status</Text>
        <Text style={styles.value}>{profile?.onboarding_status ?? "Unset"}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>Available equipment</Text>
        {activeEquipment.length > 0 ? (
          activeEquipment.map((item) => (
            <Text key={item.id} style={styles.value}>
              {item.name} / {item.weight_unit.toUpperCase()}
            </Text>
          ))
        ) : (
          <Text style={styles.value}>No equipment selected</Text>
        )}
      </View>

      <PrimaryCTAButton
        label="Sign out"
        onPress={handleSignOut}
        variant="danger"
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text.secondary,
  },
  value: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
});
