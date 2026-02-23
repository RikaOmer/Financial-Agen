import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  Alert,
  Animated,
  Easing,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getTransactionsForMonth, deleteTransaction } from '@/src/core/db/queries/transactions';
import { useBudgetStore } from '@/src/stores/budget-store';
import { formatNIS } from '@/src/utils/currency';
import { LEISURE_CATEGORIES } from '@/src/core/constants/categories';
import { CATEGORY_ICONS } from '@/src/core/constants/category-icons';
import { ThemedCard } from '@/src/components/ThemedCard';
import { AnimatedNumber } from '@/src/components/AnimatedNumber';
import { colors, typography, spacing, radius, shadows, durations } from '@/src/core/theme';
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

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const arrowLeftScale = useRef(new Animated.Value(1)).current;
  const arrowRightScale = useRef(new Animated.Value(1)).current;

  const load = useCallback(async () => {
    const txns = await getTransactionsForMonth(db, year, month);
    const grouped = groupByDate(txns);
    setSections(grouped);
    setMonthlyTotal(txns.reduce((sum, t) => sum + t.amount, 0));
  }, [db, year, month]);

  useEffect(() => { load(); }, [load]);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const animateMonthSwitch = (cb: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: durations.fast,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(() => {
      cb();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: durations.normal,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }).start();
    });
  };

  const pressArrow = (anim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const goBack = () => {
    pressArrow(arrowLeftScale);
    animateMonthSwitch(() => {
      if (month === 1) { setYear(year - 1); setMonth(12); }
      else setMonth(month - 1);
    });
  };

  const goForward = () => {
    if (isCurrentMonth) return;
    pressArrow(arrowRightScale);
    animateMonthSwitch(() => {
      if (month === 12) { setYear(year + 1); setMonth(1); }
      else setMonth(month + 1);
    });
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
      {/* Month Picker */}
      <View style={styles.monthPicker}>
        <Animated.View style={{ transform: [{ scale: arrowLeftScale }] }}>
          <Pressable onPress={goBack} style={styles.arrowBtn} hitSlop={8}>
            <MaterialIcons name="chevron-left" size={30} color={colors.primary} />
          </Pressable>
        </Animated.View>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          {isCurrentMonth && <Text style={styles.currentMonthHint}>Current month</Text>}
        </View>

        <Animated.View style={{ transform: [{ scale: arrowRightScale }] }}>
          <Pressable
            onPress={goForward}
            style={[styles.arrowBtn, isCurrentMonth && styles.arrowDisabled]}
            disabled={isCurrentMonth}
            hitSlop={8}
          >
            <MaterialIcons
              name="chevron-right"
              size={30}
              color={isCurrentMonth ? colors.textDisabled : colors.primary}
            />
          </Pressable>
        </Animated.View>
      </View>

      {/* Monthly Total */}
      <ThemedCard variant="primary" style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Monthly Total</Text>
          <AnimatedNumber value={monthlyTotal} prefix="₪" style={styles.totalAmount} />
        </View>
      </ThemedCard>

      {/* Transactions */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderSectionHeader={({ section }) => (
            <View style={styles.dateHeader}>
              <View style={styles.dateAccent} />
              <Text style={styles.dateText}>{section.title}</Text>
              <Text style={styles.dateTotalText}>{formatNIS(section.total)}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const categoryIcon = CATEGORY_ICONS[item.category] ?? CATEGORY_ICONS.other ?? 'dots-horizontal';
            return (
              <Pressable
                style={styles.txRow}
                onLongPress={() => handleLongPress(item)}
                android_ripple={Platform.OS === 'android' ? { color: colors.primaryBg } : undefined}
              >
                <View style={styles.txIconWrap}>
                  <MaterialCommunityIcons
                    name={categoryIcon}
                    size={20}
                    color={colors.textTertiary}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
                  <Text style={styles.txCategory}>
                    {LEISURE_CATEGORIES[item.category]?.label ?? item.category}
                  </Text>
                </View>
                <Text style={styles.txAmount}>{formatNIS(item.amount)}</Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="receipt-text-outline" size={56} color={colors.textDisabled} />
              <Text style={styles.emptyTitle}>No transactions</Text>
              <Text style={styles.emptyText}>
                {isCurrentMonth
                  ? 'No spending recorded yet this month. Expenses you add will appear here.'
                  : 'No spending was recorded for this month.'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.list}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  monthPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  arrowBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.circle,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  monthLabel: {
    ...typography.heading3,
    color: colors.textPrimary,
  },
  currentMonthHint: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xxs,
  },
  totalCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  totalAmount: {
    ...typography.numberSmall,
    color: colors.primary,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  dateAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  dateText: {
    ...typography.label,
    color: colors.textSecondary,
    flex: 1,
  },
  dateTotalText: {
    ...typography.bodySemiBold,
    color: colors.textSecondary,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.circle,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.md,
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  txCategory: {
    ...typography.caption,
    color: colors.textDisabled,
    marginTop: spacing.xxs,
  },
  txAmount: {
    ...typography.bodySemiBold,
    color: colors.textPrimary,
    marginStart: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
