import { PrimaryCTAButton, ResourceStat } from "@/components";
import {
  formatBalance,
  formatCreditsRate,
} from "@/features/economy/format";
import { useClaimIdleCredits, useEconomySnapshot } from "@/features/economy/queries";
import { useAuthSession } from "@/features/onboarding/queries";
import { ScreenShell } from "@/screens/ScreenShell";
import { colors, spacing, typography } from "@/tokens";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function EconomyRoute() {
  const session = useAuthSession();
  const userId = session.data?.user.id;
  const economy = useEconomySnapshot(userId);
  const claim = useClaimIdleCredits(userId);

  const pending = economy.data?.pendingCredits ?? 0;
  const canClaim = pending > 0 && !claim.isPending;

  return (
    <ScreenShell
      title="Economy console"
      subtitle="Claim idle Credits generated from stored Power."
    >
      {economy.isLoading ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : economy.error ? (
        <Text style={styles.error}>Unable to load economy state.</Text>
      ) : economy.data ? (
        <>
          <View style={styles.stats}>
            <ResourceStat
              label="Stored Power"
              value={formatBalance(economy.data.powerBalance)}
              kind="power"
            />
            <ResourceStat
              label="Credits balance"
              value={formatBalance(economy.data.creditsBalance)}
              kind="credits"
            />
            <ResourceStat
              label="Ready to claim"
              value={formatBalance(economy.data.pendingCredits)}
              kind="credits"
            />
            <ResourceStat
              label="Current idle rate"
              value={formatCreditsRate(economy.data.creditsPerHourAtCurrentPower)}
              kind="credits"
            />
          </View>

          <PrimaryCTAButton
            label={pending > 0 ? `Claim ${formatBalance(pending)} Credits` : "Nothing to claim"}
            variant="credits"
            disabled={!canClaim}
            loading={claim.isPending}
            onPress={() => claim.mutate()}
          />

          {claim.error ? (
            <Text style={styles.error}>Claim failed. Try again.</Text>
          ) : null}
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stats: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.caption,
    color: colors.accent.dangerBright,
  },
});
