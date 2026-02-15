import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import { CommitmentCard } from '@/src/features/onboarding/components/CommitmentCard';
import { insertCommitment } from '@/src/core/db/queries/commitments';
import { formatNIS } from '@/src/utils/currency';

export default function ReviewCommitmentsScreen() {
  const db = useSQLiteContext();
  const { detectedCommitments } = useOnboardingStore();
  const toggleCommitment = useOnboardingStore((s) => s.toggleCommitment);

  const selectedTotal = detectedCommitments
    .filter((c) => c.selected)
    .reduce((sum, c) => sum + c.amount, 0);

  const handleConfirm = async () => {
    const selected = detectedCommitments.filter((c) => c.selected);
    for (const c of selected) {
      await insertCommitment(db, {
        name: c.name,
        amount: c.amount,
        type: c.type,
        total_installments: c.total_installments,
        remaining_installments: c.remaining_installments,
        end_date: c.end_date,
        category: c.category,
      });
    }
    router.push('/(onboarding)/set-target');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detected Commitments</Text>
      <Text style={styles.hint}>
        Toggle off any items that are incorrect. These recurring charges will be deducted from your
        monthly budget.
      </Text>

      <FlatList
        data={detectedCommitments}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <CommitmentCard commitment={item} onToggle={() => toggleCommitment(index)} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No commitments detected. You can add them later.</Text>
        }
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total monthly commitments</Text>
        <Text style={styles.totalAmount}>{formatNIS(selectedTotal)}</Text>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirm & Set Target</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', padding: 24, paddingBottom: 4 },
  hint: { fontSize: 14, color: '#64748b', paddingHorizontal: 24, paddingBottom: 16 },
  list: { paddingHorizontal: 24 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40 },
  footer: { padding: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  totalLabel: { fontSize: 14, color: '#64748b' },
  totalAmount: { fontSize: 24, fontWeight: '700', color: '#2563eb', marginVertical: 8 },
  confirmBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
