import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NormalizedTransaction } from '@/src/types/csv';
import { formatNIS } from '@/src/utils/currency';

interface Props {
  transactions: NormalizedTransaction[];
  maxRows?: number;
}

export function CSVPreviewTable({ transactions, maxRows = 10 }: Props) {
  const display = transactions.slice(0, maxRows);

  return (
    <ScrollView horizontal style={styles.container}>
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
        {transactions.length > maxRows && (
          <Text style={styles.moreText}>
            +{transactions.length - maxRows} more transactions
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  headerRow: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#333', paddingBottom: 8 },
  row: { flexDirection: 'row', paddingVertical: 6 },
  altRow: { backgroundColor: '#f9f9f9' },
  cell: { fontSize: 14, paddingHorizontal: 8 },
  headerCell: { fontWeight: '700', color: '#333' },
  dateCol: { width: 100 },
  descCol: { width: 180 },
  amountCol: { width: 90, textAlign: 'right' },
  moreText: { padding: 8, color: '#666', fontStyle: 'italic' },
});
