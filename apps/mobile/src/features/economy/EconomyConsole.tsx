import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { CommandCard, PrimaryCTAButton, ResourceStat } from "@/components";
import { useAuthSession } from "@/features/onboarding/queries";
import { ScreenShell } from "@/screens/ScreenShell";
import { colors, spacing, typography } from "@/tokens";
import {
  economyNumber,
  formatEconomyNumber,
  useClaimCredits,
  useEconomyState,
  useUpgradeNode,
} from "./queries";

function errorMessage(error: unknown): string | null {
  return error instanceof Error ? error.message : null;
}

export function EconomyConsole() {
  const { data: session } = useAuthSession();
  const userId = session?.user.id;
  const economyState = useEconomyState(userId);
  const claimCredits = useClaimCredits(userId);
  const upgradeNode = useUpgradeNode(userId);

  const gameState = economyState.data?.gameState;
  const nodes = economyState.data?.nodes ?? [];
  const userNodes = economyState.data?.userNodes ?? [];
  const unlockedNodeIds = new Set(
    userNodes.filter((node) => node.is_unlocked).map((node) => node.node_id),
  );
  const creditsBalance = economyNumber(gameState?.credits_balance);
  const latestError =
    errorMessage(economyState.error) ??
    errorMessage(claimCredits.error) ??
    errorMessage(upgradeNode.error);

  return (
    <ScreenShell
      title="Economy console"
      subtitle="Claim server-owned Credits and route them into the MVP node chain."
    >
      {economyState.isLoading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : null}

      <View style={styles.stats}>
        <ResourceStat
          label="Power stored"
          value={formatEconomyNumber(gameState?.power_balance)}
          kind="power"
        />
        <ResourceStat
          label="Credits"
          value={formatEconomyNumber(gameState?.credits_balance)}
          kind="credits"
        />
        <ResourceStat
          label="Idle rate"
          value={`${formatEconomyNumber(gameState?.idle_rate)}/h`}
          kind="credits"
        />
      </View>

      {claimCredits.data ? (
        <Text style={styles.claimResult}>
          Claimed {formatEconomyNumber(claimCredits.data.claimedCredits)} Credits.
        </Text>
      ) : null}

      {latestError ? <Text style={styles.error}>{latestError}</Text> : null}

      <PrimaryCTAButton
        label="Claim Credits"
        variant="credits"
        loading={claimCredits.isPending}
        disabled={!userId || economyState.isLoading}
        onPress={() => claimCredits.mutate()}
      />

      <View style={styles.nodes}>
        <Text style={styles.sectionLabel}>MVP NODES</Text>
        {nodes.map((node) => {
          const isUnlocked = unlockedNodeIds.has(node.id);
          const cost = economyNumber(node.unlock_credits_cost);
          const canAfford = creditsBalance >= cost;
          const isUpgrading =
            upgradeNode.isPending && upgradeNode.variables === node.slug;

          return (
            <CommandCard
              key={node.id}
              title={node.name}
              subtitle={node.description ?? "Economy node"}
              statusLabel={isUnlocked ? "ONLINE" : `${formatEconomyNumber(cost)} Credits`}
            >
              <View style={styles.nodeMeta}>
                <Text style={styles.nodeText}>
                  Rate impact: +{formatEconomyNumber(node.base_idle_rate)}/h
                </Text>
                {isUnlocked ? (
                  <Text style={styles.nodeText}>Level 1 active</Text>
                ) : (
                  <PrimaryCTAButton
                    label={canAfford ? "Upgrade Node" : "Insufficient Credits"}
                    variant="credits"
                    loading={isUpgrading}
                    disabled={!userId || !canAfford || isUpgrading}
                    onPress={() => upgradeNode.mutate(node.slug)}
                    style={styles.nodeButton}
                  />
                )}
              </View>
            </CommandCard>
          );
        })}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },
  claimResult: {
    ...typography.caption,
    color: colors.accent.credits,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
  nodes: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text.muted,
  },
  nodeMeta: {
    gap: spacing.sm,
  },
  nodeText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  nodeButton: {
    alignSelf: "stretch",
  },
});
