import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryCTAButton } from "@/components";
import { OnboardingShell } from "@/components/OnboardingShell";
import { OptionChip } from "@/components/OptionChip";
import { EQUIPMENT_PRESETS } from "@/features/onboarding/constants";
import {
  useAuthSession,
  useEquipment,
  useSaveEquipmentSelection,
} from "@/features/onboarding/queries";
import { colors, spacing, typography } from "@/tokens";

export default function EquipmentScreen() {
  const sessionQuery = useAuthSession();
  const userId = sessionQuery.data?.user.id;
  const equipmentQuery = useEquipment(userId);
  const saveEquipment = useSaveEquipmentSelection(userId);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const selectedFromServer = useMemo(() => {
    const keys = new Set<string>();
    for (const preset of EQUIPMENT_PRESETS) {
      const hasRow = (equipmentQuery.data ?? []).some(
        (row) => row.name.toLowerCase() === preset.name.toLowerCase(),
      );
      if (hasRow) {
        keys.add(preset.key);
      }
    }
    return keys;
  }, [equipmentQuery.data]);

  useEffect(() => {
    if (selectedKeys.size === 0 && selectedFromServer.size > 0) {
      setSelectedKeys(new Set(selectedFromServer));
    }
  }, [selectedFromServer, selectedKeys.size]);

  const toggle = (key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const submit = async () => {
    if (selectedKeys.size === 0) {
      setError("No equipment selected. Choose at least one option to generate workouts.");
      return;
    }

    setError(null);

    try {
      await saveEquipment.mutateAsync(selectedKeys);
      router.replace("/home");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not save equipment.";
      setError(message);
    }
  };

  return (
    <OnboardingShell
      eyebrow="Equipment bay"
      title="Select available equipment."
      body="The reactor uses this inventory to scope starter workouts. Machines, cables, and free weights only."
      step="02 / 02"
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryCTAButton
            label="Enter main console"
            variant="success"
            loading={saveEquipment.isPending || equipmentQuery.isLoading}
            onPress={submit}
          />
        </>
      }
    >
      <View style={styles.stack}>
        {EQUIPMENT_PRESETS.map((preset) => (
          <OptionChip
            key={preset.key}
            label={preset.name}
            selected={selectedKeys.has(preset.key)}
            onPress={() => toggle(preset.key)}
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
