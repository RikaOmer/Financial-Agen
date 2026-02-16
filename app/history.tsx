import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { getTransactionsForMonth, deleteTransaction } from '@/src/core/db/queries/transactions';
import { useBudgetStore } from '@/src/stores/budget-store';
import { formatNIS } from '@/src/utils/currency';
import { LEISURE_CATEGORIES } from '@/src/core/constants/categories';
import type { Transaction } from '@/src/types/database';

interface Section {
  title: string;
  data: Transaction[];
  total: number;
}

function groupByDate(transactions: Transaction[]): Section[] {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const dateKey = tx.timestamp.split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(tx);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, data]) => ({
      title: new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      data,
      total: data.reduce((sum, tx) => sum + tx.amount, 0),
    }));
}

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const refreshBudget = useBudgetStore((s) => s.refreshBudget);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [sections, setSections] = useState<Section[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const load = useCallback(async () => {
    const txns = await getTransactionsForMonth(db, year, month);
    const grouped = groupByDate(txns);
    setSections(grouped);
    setMonthlyTotal(txns.reduce((sum, t) => sum + t.amount, 0));
  }, [db, year, month]);

  useEffect(() => { load(); }, [load]);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const goBack = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };

  const goForward = () => {
    if (isCurrentMonth) return;
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  const monthLabel = new Date(year, month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleLongPress = (tx: Transaction) => {
    Alert.alert('Delete Transaction', `Remove "${tx.description}" (${formatNIS(tx.amount)})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(db, tx.id);
          await Promise.all([load(), refreshBudget(db)]);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthPicker}>
        <TouchableOpacity onPress={goBack} style={styles.arrow}>
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={goForward}
          style={[styles.arrow, isCurrentMonth && styles.arrowDisabled]}
          disabled={isCurrentMonth}
        >
          <Text style={[styles.arrowText, isCurrentMonth && styles.arrowTextDisabled]}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalBadge}>
        <Text style={styles.totalLabel}>Monthly Total</Text>
        <Text style={styles.totalAmount}>{formatNIS(monthlyTotal)}</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderSectionHeader={({ section }) => (
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>{section.title}</Text>
            <Text style={styles.dateTotalText}>{formatNIS(section.total)}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.txRow} onLongPress={() => handleLongPress(item)}>
            <View style={styles.txInfo}>
              <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
              <Text style={styles.txCategory}>
                {LEISURE_CATEGORIES[item.category]?.label ?? item.category}
              </Text>
            </View>
            <Text style={styles.txAmount}>{formatNIS(item.amount)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transactions for this month.</Text>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  monthPicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  arrow: { padding: 8 },
  arrowText: { fontSize: 20, fontWeight: '700', color: '#2563eb' },
  arrowDisabled: { opacity: 0.3 },
  arrowTextDisabled: { color: '#94a3b8' },
  monthLabel: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  totalBadge: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#eff6ff' },
  totalLabel: { fontSize: 14, color: '#1e40af', fontWeight: '500' },
  totalAmount: { fontSize: 16, fontWeight: '700', color: '#2563eb' },
  list: { padding: 16, paddingBottom: 32 },
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, backgroundColor: '#f8fafc' },
  dateText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  dateTotalText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 6 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 15, color: '#374151' },
  txCategory: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginLeft: 12 },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
});
