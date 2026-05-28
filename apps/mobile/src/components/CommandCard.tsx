import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/tokens";

export type CommandCardTone = "standard" | "economic" | "danger" | "success";

export type CommandCardProps = {
  statusLabel: string;
  headline: string;
  consequence: string;
  tone?: CommandCardTone;
  cta?: ReactNode;
  resourcePreview?: ReactNode;
  footer?: ReactNode;
};

export function CommandCard({
  statusLabel,
  headline,
  consequence,
  tone = "standard",
  cta,
  resourcePreview,
  footer,
}: CommandCardProps) {
  return (
    <View style={[styles.card, cardToneStyles[tone]]}>
      <View style={[styles.statusRail, railToneStyles[tone]]} />
      <View style={styles.content}>
        <Text style={[styles.statusLabel, labelToneStyles[tone]]}>{statusLabel}</Text>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.consequence}>{consequence}</Text>
        {resourcePreview ? <View style={styles.resourcePreview}>{resourcePreview}</View> : null}
        {cta ? <View style={styles.ctaSlot}>{cta}</View> : null}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.background.surface,
    padding: spacing.lg,
  },
  statusRail: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 3,
  },
  content: {
    gap: spacing.md,
  },
  statusLabel: {
    ...typography.label,
  },
  headline: {
    ...typography.title,
    color: colors.text.primary,
  },
  consequence: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  resourcePreview: {
    paddingTop: spacing.xs,
  },
  ctaSlot: {
    paddingTop: spacing.xs,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.background.borderSubtle,
    paddingTop: spacing.md,
  },
});

const cardToneStyles = StyleSheet.create({
  standard: {
    borderColor: colors.background.border,
  },
  economic: {
    borderColor: colors.accent.creditsMuted,
    backgroundColor: colors.background.surfaceRaised,
  },
  danger: {
    borderColor: colors.accent.dangerBright,
    backgroundColor: colors.accent.dangerTint,
  },
  success: {
    borderColor: colors.accent.successMuted,
    backgroundColor: colors.background.surfaceRaised,
  },
});

const railToneStyles = StyleSheet.create({
  standard: {
    backgroundColor: colors.background.borderStrong,
  },
  economic: {
    backgroundColor: colors.accent.credits,
  },
  danger: {
    backgroundColor: colors.accent.danger,
  },
  success: {
    backgroundColor: colors.accent.success,
  },
});

const labelToneStyles = StyleSheet.create({
  standard: {
    color: colors.text.muted,
  },
  economic: {
    color: colors.accent.credits,
  },
  danger: {
    color: colors.text.primary,
  },
  success: {
    color: colors.accent.success,
  },
});
