import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import type { DetectedCommitment } from '@/src/types/csv';
import { formatNIS } from '@/src/utils/currency';
import { LEISURE_CATEGORIES } from '@/src/core/constants/categories';

interface Props {
  commitment: DetectedCommitment;
  onToggle: () => void;
}

export function CommitmentCard({ commitment, onToggle }: Props) {
  const categoryLabel = LEISURE_CATEGORIES[commitment.category]?.label ?? 'Other';

  return (
    <View style={[styles.card, !commitment.selected && styles.cardDisabled]}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{commitment.name}</Text>
          <Text style={styles.meta}>
            {commitment.type === 'subscription' ? 'Subscription' : 'Installment'}
            {commitment.remaining_installments
              ? ` (${commitment.remaining_installments} remaining)`
              : ''}
          </Text>
        </View>
        <Switch value={commitment.selected} onValueChange={onToggle} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.amount}>{formatNIS(commitment.amount)}/mo</Text>
        <Text style={styles.category}>{categoryLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDisabled: { opacity: 0.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  meta: { fontSize: 13, color: '#666', marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  amount: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  category: { fontSize: 13, color: '#888', alignSelf: 'flex-end' },
});
