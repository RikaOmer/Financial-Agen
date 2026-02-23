import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Animated, Alert, StyleSheet, Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBudgetState } from '@/src/features/budget/hooks/useBudgetState';
import { BudgetGauge } from '@/src/features/budget/components/BudgetGauge';
import { WishlistFundBadge } from '@/src/features/budget/components/WishlistFundBadge';
import { CategorySelector } from '@/src/components/CategorySelector';
import { ThemedCard } from '@/src/components/ThemedCard';
import { AnimatedNumber } from '@/src/components/AnimatedNumber';
import { EmptyState } from '@/src/components/EmptyState';
import { BottomSheet } from '@/src/components/BottomSheet';
import { LoadingSkeleton } from '@/src/components/LoadingSkeleton';
import { ThemedButton } from '@/src/components/ThemedButton';
import { getTodayTransactions, deleteTransaction, updateTransaction } from '@/src/core/db/queries/transactions';
import { getSavingsGoal } from '@/src/core/db/queries/settings';
import { formatNIS } from '@/src/utils/currency';
import { useBudgetStore } from '@/src/stores/budget-store';
import { CATEGORY_ICONS } from '@/src/core/constants/category-icons';
import { colors, typography, spacing, radius, shadows, durations } from '@/src/core/theme';
import type { Transaction } from '@/src/types/database';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const STAGGER_DELAY = 80;

function StaggeredCard({ index, children, variant, style }: { index: number; children: React.ReactNode; variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'; style?: any }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const delay = index * STAGGER_DELAY;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: durations.entrance,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: durations.entrance,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [index, fadeAnim, slideAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <ThemedCard variant={variant} style={style}>
        {children}
      </ThemedCard>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const { snapshot, isLoading } = useBudgetState();
  const refreshBudget = useBudgetStore((s) => s.refreshBudget);
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
    setEditAmount(String(tx.amount));
    setEditDesc(tx.description);
    setEditCategory(tx.category);
    setEditingTx(tx);
  };

  const handleDelete = () => {
    if (!editingTx) return;
    Alert.alert(
      'Delete Transaction',
      `Remove "${editingTx.description}" (${formatNIS(editingTx.amount)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(db, editingTx.id);
            setEditingTx(null);
            await Promise.all([refreshList(), refreshBudget(db)]);
          },
        },
      ],
    );
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
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.skeletonGaugeRow}>
            <LoadingSkeleton preset="gauge" />
          </View>
          <View style={styles.statsRow}>
            <LoadingSkeleton preset="card" style={styles.skeletonCard} />
            <LoadingSkeleton preset="card" style={styles.skeletonCard} />
          </View>
          <LoadingSkeleton preset="text" style={styles.skeletonLine} />
          <LoadingSkeleton preset="text" style={styles.skeletonLine} />
          <LoadingSkeleton preset="text" style={styles.skeletonLine} />
        </View>
      </View>
    );
  }

  const statCards: { label: string; value: number; isMoney: boolean; icon: MCIcon; iconColor: string; variant: 'primary' | 'warning' | 'danger' | 'success' }[] = [
    { label: 'Monthly Target', value: snapshot.monthlyTarget, isMoney: true, icon: 'target', iconColor: colors.primary, variant: 'primary' },
    { label: 'Commitments', value: snapshot.totalCommitments, isMoney: true, icon: 'calendar-sync', iconColor: colors.warning, variant: 'warning' },
    { label: 'Spent This Month', value: snapshot.spentThisMonth, isMoney: true, icon: 'cart-outline', iconColor: colors.danger, variant: 'danger' },
    { label: 'Days Remaining', value: snapshot.daysRemaining, isMoney: false, icon: 'calendar-clock', iconColor: colors.success, variant: 'success' },
  ];

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <BudgetGauge
          dailyBudget={snapshot.dailyBudget}
          spentToday={spentToday}
          monthlyTarget={snapshot.monthlyTarget}
          spentThisMonth={snapshot.spentThisMonth}
          totalCommitments={snapshot.totalCommitments}
        />

        <View style={styles.statsRow}>
          {statCards.slice(0, 2).map((s, i) => (
            <StaggeredCard key={s.label} index={i} style={styles.statCardInner}>
              <View style={styles.statHeader}>
                <MaterialCommunityIcons name={s.icon} size={20} color={s.iconColor} />
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
              {s.isMoney ? (
                <AnimatedNumber value={s.value} prefix="₪" style={styles.statValue} />
              ) : (
                <AnimatedNumber value={s.value} style={styles.statValue} />
              )}
            </StaggeredCard>
          ))}
        </View>

        <View style={styles.statsRow}>
          {statCards.slice(2, 4).map((s, i) => (
            <StaggeredCard key={s.label} index={i + 2} style={styles.statCardInner}>
              <View style={styles.statHeader}>
                <MaterialCommunityIcons name={s.icon} size={20} color={s.iconColor} />
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
              {s.isMoney ? (
                <AnimatedNumber value={s.value} prefix="₪" style={styles.statValue} />
              ) : (
                <AnimatedNumber value={s.value} style={styles.statValue} />
              )}
            </StaggeredCard>
          ))}
        </View>

        {snapshot.rollingOffset > 0 && (
          <ThemedCard variant="success" style={styles.offsetCard}>
            <View style={styles.offsetRow}>
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.success} />
              <Text style={styles.offsetText}>
                +{formatNIS(snapshot.rollingOffset)} carried from yesterday (zero-spend bonus)
              </Text>
            </View>
          </ThemedCard>
        )}

        <WishlistFundBadge
          amount={snapshot.wishlistFund}
          goalName={savingsGoal?.name}
          goalAmount={savingsGoal?.amount}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Transactions</Text>
          <Pressable
            onPress={() => router.push('/history')}
            android_ripple={{ color: colors.primaryBg }}
            style={styles.viewAllBtn}
            hitSlop={8}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary} />
          </Pressable>
        </View>

        {todayTxns.length === 0 ? (
          <EmptyState
            icon="celebration"
            title="No spending today"
            description="Keep it up! Add an expense when you spend."
            actionTitle="Add Expense"
            onAction={() => router.push('/(tabs)/add-expense')}
          />
        ) : (
          <>
            {todayTxns.map((tx) => {
              const categoryIcon = CATEGORY_ICONS[tx.category] || CATEGORY_ICONS.other;
              return (
                <Pressable
                  key={tx.id}
                  style={styles.txRow}
                  onLongPress={() => handleLongPress(tx)}
                  android_ripple={Platform.OS === 'android' ? { color: colors.primaryBg } : undefined}
                  accessibilityHint="Long press to edit or delete"
                >
                  <View style={styles.txIconWrap}>
                    <MaterialCommunityIcons name={categoryIcon} size={20} color={colors.textTertiary} />
                  </View>
                  <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                  <Text style={styles.txAmount}>{formatNIS(tx.amount)}</Text>
                </Pressable>
              );
            })}
            <Text style={styles.longPressHint}>Long press a transaction to edit or delete</Text>
          </>
        )}
      </ScrollView>

      <BottomSheet
        visible={!!editingTx}
        onClose={() => setEditingTx(null)}
        title="Edit Transaction"
      >
        <Text style={styles.editLabel}>Amount</Text>
        <TextInput
          style={styles.editInput}
          value={editAmount}
          onChangeText={setEditAmount}
          placeholder="Amount"
          keyboardType="numeric"
        />
        <Text style={styles.editLabel}>Description</Text>
        <TextInput
          style={styles.editInput}
          value={editDesc}
          onChangeText={setEditDesc}
          placeholder="Description"
        />
        <CategorySelector selected={editCategory} onSelect={setEditCategory} />
        <View style={styles.editActions}>
          <ThemedButton
            title="Delete"
            onPress={handleDelete}
            variant="danger"
            size="md"
            icon="delete"
            style={styles.editBtnFlex}
          />
          <ThemedButton
            title="Save"
            onPress={handleSaveEdit}
            variant="primary"
            size="md"
            icon="check"
            style={styles.editBtnFlex}
          />
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statCardInner: { flex: 1, padding: spacing.md },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  statValue: {
    ...typography.numberSmall,
    color: colors.textPrimary,
  },
  offsetCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  offsetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  offsetText: {
    ...typography.captionMedium,
    color: colors.success,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading4,
    color: colors.textPrimary,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xxs,
  },
  viewAllText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.md,
  },
  txDesc: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  txAmount: {
    ...typography.bodySemiBold,
    color: colors.textPrimary,
    marginStart: spacing.md,
  },
  longPressHint: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  editLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  editInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  editBtnFlex: { flex: 1 },
  // Loading skeleton
  skeletonGaugeRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  skeletonCard: { flex: 1 },
  skeletonLine: { marginTop: spacing.md },
});
