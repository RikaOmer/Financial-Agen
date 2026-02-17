import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NormalizedTransaction } from '@/src/types/csv';
import { formatNIS } from '@/src/utils/currency';
import { ThemedCard } from '@/src/components/ThemedCard';
import { colors, typography, radius, spacing } from '@/src/core/theme';

interface Props {
  transactions: NormalizedTransaction[];
  maxRows?: number;
}

export function CSVPreviewTable({ transactions, maxRows = 10 }: Props) {
  const display = transactions.slice(0, maxRows);
  const remaining = transactions.length - maxRows;

  return (
    <ThemedCard style={styles.cardOverride}>
      <ScrollView horizontal>
        <View>
          <View style={styles.headerRow}>
            <Text style={[styles.cell, styles.headerCell, styles.dateCol]}>Date</Text>
            <Text style={[styles.cell, styles.headerCell, styles.descCol]}>Description</Text>
            <Text style={[styles.cell, styles.headerCell, styles.amountCol]}>Amount</Text>
          </View>
          {display.map((tx, i) => (
            <View key={i} style={[styles.row, i % 2 === 0 && styles.altRow]}>
              <Text style={[styles.cell, styles.dateCol]}>{tx.date}</Text>
              <Text style={[styles.cell, styles.descCol]} numberOfLines={1}>
                {tx.description}
              </Text>
              <Text style={[styles.cell, styles.amountCol]}>{formatNIS(tx.amount)}</Text>
            </View>
          ))}
          {remaining > 0 && (
            <View style={styles.moreBadge}>
              <Text style={styles.moreText}>+{remaining} more transactions</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedCard>
  );
}

const styles = StyleSheet.create({
  cardOverride: {
    padding: 0,
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.primaryBg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
  },
  row: { flexDirection: 'row', paddingVertical: spacing.xs + 2 },
  altRow: { backgroundColor: colors.borderLight },
  cell: { ...typography.caption, paddingHorizontal: spacing.sm },
  headerCell: {
    ...typography.captionMedium,
    color: colors.primary,
  },
  dateCol: { width: 100 },
  descCol: { width: 180 },
  amountCol: { width: 90, textAlign: 'right' },
  moreBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
  },
  moreText: {
    ...typography.captionMedium,
    color: colors.textTertiary,
  },
});
