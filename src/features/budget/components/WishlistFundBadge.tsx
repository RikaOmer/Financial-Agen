import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatNIS } from '@/src/utils/currency';
import { ProgressBar } from '@/src/components/ProgressBar';

interface Props {
  amount: number;
  goalName?: string;
  goalAmount?: number;
}

export function WishlistFundBadge({ amount, goalName, goalAmount }: Props) {
  const progress = goalAmount && goalAmount > 0 ? Math.min(1, amount / goalAmount) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Wishlist Fund</Text>
      <Text style={styles.amount}>{formatNIS(amount)}</Text>
      {goalName && goalAmount ? (
        <View style={styles.goalRow}>
          <ProgressBar progress={progress} color="#f59e0b" backgroundColor="#fde68a" height={6} />
          <Text style={styles.goalText}>
            {Math.round(progress * 100)}% toward {goalName}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fefce8',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  label: { fontSize: 13, color: '#92400e', fontWeight: '600' },
  amount: { fontSize: 22, fontWeight: '700', color: '#b45309', marginTop: 4 },
  goalRow: { marginTop: 8 },
  goalText: { fontSize: 12, color: '#92400e', marginTop: 4 },
});
