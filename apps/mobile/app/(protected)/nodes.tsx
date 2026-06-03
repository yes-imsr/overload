import { CommandCard, PrimaryCTAButton, ResourceStat } from "@/components";
import {
  formatBalance,
  formatCreditsRate,
  formatNodeBlockReason,
  formatNodeCost,
} from "@/features/economy/format";
import { useEconomySnapshot, useUpgradeNode } from "@/features/economy/queries";
import { useAuthSession } from "@/features/onboarding/queries";
import { ScreenShell } from "@/screens/ScreenShell";
import { colors, spacing, typography } from "@/tokens";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

export default function NodesScreen() {
  const session = useAuthSession();
  const userId = session.data?.user.id;
  const economy = useEconomySnapshot(userId);
  const upgrade = useUpgradeNode(userId);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  return (
    <ScreenShell
      title="Nodes"
      subtitle="Unlock MVP nodes to raise idle conversion."
    >
      {economy.isLoading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : economy.error ? (
        <Text style={styles.error}>Unable to load node state.</Text>
      ) : economy.data ? (
        <>
          <View style={styles.stats}>
            <ResourceStat
              label="Stored Power"
              value={formatBalance(economy.data.powerBalance)}
              kind="power"
            />
            <ResourceStat
              label="Credits rate"
              value={formatCreditsRate(economy.data.creditsPerHourAtCurrentPower)}
              kind="credits"
            />
          </View>

          <View style={styles.list}>
            {economy.data.nodes.map((node) => {
              const statusLabel = node.isUnlocked
                ? "ONLINE"
                : formatNodeBlockReason(node.blockReason)?.toUpperCase() ?? "LOCKED";
              const isUpgrading = upgrade.isPending && activeNodeId === node.id;

              return (
                <View key={node.id} style={styles.nodeCard}>
                  <CommandCard
                    title={node.name}
                    subtitle={node.description ?? undefined}
                    statusLabel={statusLabel}
                  />
                  <Text style={styles.meta}>
                    Cost: {formatNodeCost(node.unlockCreditsCost)} · Rate +{node.baseIdleRate}
                  </Text>
                  {!node.isUnlocked ? (
                    <PrimaryCTAButton
                      label={`Unlock for ${formatNodeCost(node.unlockCreditsCost)}`}
                      variant="credits"
                      disabled={!node.canUnlock || isUpgrading}
                      loading={isUpgrading}
                      onPress={() => {
                        setActiveNodeId(node.id);
                        upgrade.mutate(node.id, {
                          onSettled: () => setActiveNodeId(null),
                        });
                      }}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>

          {upgrade.error ? (
            <Text style={styles.error}>Node unlock failed. Check Credits and order.</Text>
          ) : null}
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stats: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  nodeCard: {
    gap: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.text.muted,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
});
