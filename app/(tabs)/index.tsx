import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useBudgetState } from '@/src/features/budget/hooks/useBudgetState';
import { BudgetGauge } from '@/src/features/budget/components/BudgetGauge';
import { WishlistFundBadge } from '@/src/features/budget/components/WishlistFundBadge';
import { getTodayTransactions } from '@/src/core/db/queries/transactions';
import { getSavingsGoal } from '@/src/core/db/queries/settings';
import { formatNIS } from '@/src/utils/currency';
import { useEffect, useState } from 'react';
import type { Transaction } from '@/src/types/database';

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const { snapshot, isLoading } = useBudgetState();
  const [todayTxns, setTodayTxns] = useState<Transaction[]>([]);
  const [savingsGoal, setSavingsGoal] = useState<{ name: string; amount: number } | null>(null);

  useEffect(() => {
    getTodayTransactions(db).then(setTodayTxns);
    getSavingsGoal(db).then(setSavingsGoal);
  }, [db, snapshot]);

  const spentToday = todayTxns.reduce((sum, t) => sum + t.amount, 0);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading budget...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BudgetGauge
        dailyBudget={snapshot.dailyBudget}
        spentToday={spentToday}
        monthlyTarget={snapshot.monthlyTarget}
        spentThisMonth={snapshot.spentThisMonth}
      />

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Monthly Target</Text>
          <Text style={styles.statValue}>{formatNIS(snapshot.monthlyTarget)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Commitments</Text>
          <Text style={styles.statValue}>{formatNIS(snapshot.totalCommitments)}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Spent This Month</Text>
          <Text style={styles.statValue}>{formatNIS(snapshot.spentThisMonth)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Days Remaining</Text>
          <Text style={styles.statValue}>{snapshot.daysRemaining}</Text>
        </View>
      </View>

      {snapshot.rollingOffset > 0 && (
        <View style={styles.offsetBadge}>
          <Text style={styles.offsetText}>
            +{formatNIS(snapshot.rollingOffset)} carried from yesterday (zero-spend bonus)
          </Text>
        </View>
      )}

      <WishlistFundBadge
        amount={snapshot.wishlistFund}
        goalName={savingsGoal?.name}
        goalAmount={savingsGoal?.amount}
      />

      <Text style={styles.sectionTitle}>Today's Transactions</Text>
      {todayTxns.length === 0 ? (
        <Text style={styles.emptyText}>No spending today. Keep it up!</Text>
      ) : (
        todayTxns.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
            <Text style={styles.txAmount}>{formatNIS(tx.amount)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748b', fontSize: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  statLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  offsetBadge: { backgroundColor: '#ecfdf5', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#a7f3d0' },
  offsetText: { color: '#047857', fontSize: 13, fontWeight: '500' },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a', marginTop: 16, marginBottom: 8 },
  emptyText: { color: '#64748b', fontStyle: 'italic', paddingVertical: 12 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  txDesc: { flex: 1, fontSize: 15, color: '#374151' },
  txAmount: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginLeft: 12 },
});
