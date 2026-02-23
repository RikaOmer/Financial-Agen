import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { SemanticAnalysisResult } from '@/src/types/behavioral';
import { colors, typography, spacing, radius, shadows } from '@/src/core/theme';

interface Props {
  analysis: SemanticAnalysisResult;
}

export function SemanticSummaryCard({ analysis }: Props) {
  const { outliers, convenienceClusters, lifeConstraints } = analysis;

  const summaryParts: string[] = [];

  if (outliers.length > 0) {
    summaryParts.push(
      `${outliers.length} unusual ${outliers.length === 1 ? 'transaction' : 'transactions'}`,
    );
  }

  if (convenienceClusters.length > 0) {
    const totalOrders = convenienceClusters.reduce((sum, c) => sum + c.count, 0);
    summaryParts.push(`${totalOrders} delivery orders`);
  }

  const constraintLabels = lifeConstraints.map((c) => c.label);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="psychology" size={22} color={colors.primary} />
        <Text style={styles.title}>What we found</Text>
      </View>

      {summaryParts.length > 0 && (
        <Text style={styles.summaryText}>
          Found {summaryParts.join(', ')}
        </Text>
      )}

      {constraintLabels.length > 0 && (
        <View style={styles.constraintsRow}>
          <Text style={styles.detectedLabel}>Detected:</Text>
          <View style={styles.chipRow}>
            {constraintLabels.map((label) => (
              <View key={label} style={styles.chip}>
                <Text style={styles.chipText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {summaryParts.length === 0 && constraintLabels.length === 0 && (
        <Text style={styles.summaryText}>
          We analyzed your spending patterns. A few quick questions to personalize your experience.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.primaryBg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading4,
    color: colors.textPrimary,
  },
  summaryText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  constraintsRow: {
    marginTop: spacing.sm,
  },
  detectedLabel: {
    ...typography.captionMedium,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  chipText: {
    ...typography.caption,
    color: colors.primary,
  },
});
