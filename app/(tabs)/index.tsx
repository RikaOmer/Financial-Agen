import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBudgetState } from '@/src/features/budget/hooks/useBudgetState';
import { BudgetGauge } from '@/src/features/budget/components/BudgetGauge';
import { WishlistFundBadge } from '@/src/features/budget/components/WishlistFundBadge';
import { CategorySelector } from '@/src/components/CategorySelector';
import { getTodayTransactions, deleteTransaction, updateTransaction } from '@/src/core/db/queries/transactions';
import { getSavingsGoal } from '@/src/core/db/queries/settings';
import { formatNIS } from '@/src/utils/currency';
import { useBudgetStore } from '@/src/stores/budget-store';
import type { Transaction } from '@/src/types/database';

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const { snapshot, isLoading } = useBudgetState();
  const refreshBudget = useBudgetStore((s) => s.refreshBudget);
  const insets = useSafeAreaInsets();
  const [todayTxns, setTodayTxns] = useState<Transaction[]>([]);
  const [savingsGoal, setSavingsGoal] = useState<{ name: string; amount: number } | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');

  useEffect(() => {
    getTodayTransactions(db).then(setTodayTxns);
    getSavingsGoal(db).then(setSavingsGoal);
  }, [db, snapshot]);

  const spentToday = todayTxns.reduce((sum, t) => sum + t.amount, 0);

  const refreshList = async () => {
    const txns = await getTodayTransactions(db);
    setTodayTxns(txns);
  };

  const handleLongPress = (tx: Transaction) => {
    Alert.alert(tx.description, formatNIS(tx.amount), [
      {
        text: 'Edit',
        onPress: () => {
          setEditAmount(String(tx.amount));
          setEditDesc(tx.description);
          setEditCategory(tx.category);
          setEditingTx(tx);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(db, tx.id);
          await Promise.all([refreshList(), refreshBudget(db)]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;
    const amount = parseFloat(editAmount);
    if (!amount || amount <= 0) return;
    await updateTransaction(db, editingTx.id, {
      amount,
      description: editDesc.trim(),
      category: editCategory,
    });
    setEditingTx(null);
    await Promise.all([refreshList(), refreshBudget(db)]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading budget...</Text>
      </View>
    );
  }

  return (
    <>
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Transactions</Text>
        <TouchableOpacity onPress={() => router.push('/history')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {todayTxns.length === 0 ? (
        <Text style={styles.emptyText}>No spending today. Keep it up!</Text>
      ) : (
        todayTxns.map((tx) => (
          <TouchableOpacity key={tx.id} style={styles.txRow} onLongPress={() => handleLongPress(tx)}>
            <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
            <Text style={styles.txAmount}>{formatNIS(tx.amount)}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>

    <Modal visible={!!editingTx} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modal, { paddingBottom: Math.max(24, insets.bottom) }]}>
          <Text style={styles.modalTitle}>Edit Transaction</Text>
          <TextInput style={styles.modalInput} value={editAmount} onChangeText={setEditAmount} placeholder="Amount" keyboardType="numeric" />
          <TextInput style={styles.modalInput} value={editDesc} onChangeText={setEditDesc} placeholder="Description" />
          <CategorySelector selected={editCategory} onSelect={setEditCategory} />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingTx(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveEdit}>
              <Text style={styles.confirmText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  viewAllText: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
  emptyText: { color: '#64748b', fontStyle: 'italic', paddingVertical: 12 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  txDesc: { flex: 1, fontSize: 15, color: '#374151' },
  txAmount: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginLeft: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#e2e8f0' },
  cancelText: { color: '#475569', fontWeight: '600' },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#2563eb' },
  confirmText: { color: '#fff', fontWeight: '600' },
});
