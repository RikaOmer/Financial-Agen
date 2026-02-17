import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  TextInput,
  Alert,
  Animated,
  Pressable,
  Easing,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getActiveCommitments,
  insertCommitment,
  deleteCommitment,
} from '@/src/core/db/queries/commitments';
import { useBudgetStore } from '@/src/stores/budget-store';
import type { Commitment } from '@/src/types/database';
import { formatNIS } from '@/src/utils/currency';
import { LEISURE_CATEGORIES } from '@/src/core/constants/categories';
import { CategorySelector } from '@/src/components/CategorySelector';
import { CATEGORY_ICONS } from '@/src/core/constants/category-icons';
import { projectCommitments } from '@/src/features/budget/utils/commitment-projection';
import { SectionHeader } from '@/src/components/SectionHeader';
import { ThemedCard } from '@/src/components/ThemedCard';
import { AnimatedNumber } from '@/src/components/AnimatedNumber';
import { BottomSheet } from '@/src/components/BottomSheet';
import { ThemedButton } from '@/src/components/ThemedButton';
import { useToast } from '@/src/components/Toast';
import { colors, typography, spacing, radius, shadows, durations } from '@/src/core/theme';

export default function CommitmentsScreen() {
  const db = useSQLiteContext();
  const { showToast } = useToast();
  const refreshBudget = useBudgetStore((s) => s.refreshBudget);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'subscription' | 'installment'>('subscription');
  const [newInstallments, setNewInstallments] = useState('');
  const [newCategory, setNewCategory] = useState('subscriptions');
  const [showProjection, setShowProjection] = useState(false);

  const chevronAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    const data = await getActiveCommitments(db);
    setCommitments(data);
  }, [db]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: showProjection ? 1 : 0,
      duration: durations.normal,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [showProjection, chevronAnim]);

  const subscriptions = commitments.filter((c) => c.type === 'subscription');
  const installments = commitments.filter((c) => c.type === 'installment');
  const total = commitments.reduce((sum, c) => sum + c.amount, 0);

  const sections = [
    { title: 'Subscriptions', count: subscriptions.length, data: subscriptions },
    { title: 'Installments', count: installments.length, data: installments },
  ].filter((s) => s.data.length > 0);

  const projections = projectCommitments(commitments);

  const formatMonthLabel = (monthKey: string): string => {
    const [year, month] = monthKey.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleAdd = async () => {
    const amount = parseFloat(newAmount);
    if (!newName.trim() || !amount || amount <= 0) {
      showToast('Please fill in name and amount.', 'warning');
      return;
    }

    const totalInst = newType === 'installment' ? parseInt(newInstallments, 10) || 12 : null;

    await insertCommitment(db, {
      name: newName.trim(),
      amount,
      type: newType,
      total_installments: totalInst,
      remaining_installments: totalInst,
      end_date: null,
      category: newCategory,
    });

    setShowAdd(false);
    setNewName('');
    setNewAmount('');
    setNewInstallments('');
    await load();
    await refreshBudget(db);
    showToast(`Added "${newName.trim()}"`, 'success');
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCommitment(db, id);
            await Promise.all([load(), refreshBudget(db)]);
            showToast(`Deleted "${name}"`, 'success');
          } catch {
            showToast('Failed to delete commitment. Please try again.', 'error');
            await load();
          }
        },
      },
    ]);
  };

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderRow}>
            <SectionHeader title={section.title} />
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{section.count}</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => {
          const iconName = item.type === 'subscription' ? 'repeat' : 'cash-multiple';
          const categoryIconName = CATEGORY_ICONS[item.category] ?? 'dots-horizontal';
          return (
            <ThemedCard style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name={categoryIconName}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.itemMetaRow}>
                    <MaterialCommunityIcons
                      name={iconName as any}
                      size={12}
                      color={colors.textDisabled}
                      style={{ marginEnd: spacing.xs }}
                    />
                    <Text style={styles.itemMeta}>
                      {LEISURE_CATEGORIES[item.category]?.label ?? 'Other'}
                      {item.remaining_installments ? ` - ${item.remaining_installments} left` : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemAmount}>{formatNIS(item.amount)}</Text>
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id, item.name)}
                  hitSlop={8}
                  android_ripple={Platform.OS === 'android' ? { color: colors.dangerBg, borderless: true } : undefined}
                >
                  <MaterialIcons name="delete-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>
            </ThemedCard>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={56} color={colors.textDisabled} />
            <Text style={styles.emptyTitle}>No commitments yet</Text>
            <Text style={styles.emptyText}>Add subscriptions or installments to track.</Text>
          </View>
        }
        ListFooterComponent={
          commitments.length > 0 ? (
            <View style={styles.footerContainer}>
              <ThemedCard variant="primary" style={styles.totalCard}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Monthly</Text>
                  <AnimatedNumber
                    value={total}
                    prefix="₪"
                    style={styles.totalAmount}
                  />
                </View>
              </ThemedCard>

              <Pressable
                style={styles.projectionToggle}
                onPress={() => setShowProjection(!showProjection)}
                android_ripple={Platform.OS === 'android' ? { color: colors.primaryBg } : undefined}
              >
                <Text style={styles.projectionToggleText}>
                  {showProjection ? 'Hide Projection' : 'Show 6-Month Projection'}
                </Text>
                <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                  <MaterialIcons name="expand-more" size={22} color={colors.primary} />
                </Animated.View>
              </Pressable>

              {showProjection && projections.map((p) => (
                <ThemedCard key={p.month} style={styles.projectionCard}>
                  <Text style={styles.projectionMonth}>{formatMonthLabel(p.month)}</Text>
                  <Text style={styles.projectionTotal}>{formatNIS(p.totalCommitments)}</Text>
                  {p.breakdown.map((item, idx) => (
                    <View key={idx} style={styles.projectionItem}>
                      <Text style={styles.projectionItemName}>{item.name}</Text>
                      <Text style={styles.projectionItemAmount}>{formatNIS(item.amount)}</Text>
                    </View>
                  ))}
                </ThemedCard>
              ))}
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
      />

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => setShowAdd(true)}
        android_ripple={Platform.OS === 'android' ? { color: colors.primaryDark, borderless: true } : undefined}
      >
        <MaterialIcons name="add" size={28} color={colors.textInverse} />
      </Pressable>

      {/* Add commitment bottom sheet */}
      <BottomSheet visible={showAdd} onClose={() => setShowAdd(false)} title="Add Commitment">
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={setNewName}
          placeholder="Name (e.g. Netflix)"
          placeholderTextColor={colors.textDisabled}
        />
        <TextInput
          style={styles.input}
          value={newAmount}
          onChangeText={setNewAmount}
          placeholder="Monthly amount"
          placeholderTextColor={colors.textDisabled}
          keyboardType="numeric"
        />

        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeChip, newType === 'subscription' && styles.typeChipActive]}
            onPress={() => setNewType('subscription')}
          >
            <MaterialCommunityIcons
              name="repeat"
              size={16}
              color={newType === 'subscription' ? colors.textInverse : colors.textTertiary}
              style={{ marginEnd: spacing.xs }}
            />
            <Text style={[styles.typeText, newType === 'subscription' && styles.typeTextActive]}>Subscription</Text>
          </Pressable>
          <Pressable
            style={[styles.typeChip, newType === 'installment' && styles.typeChipActive]}
            onPress={() => setNewType('installment')}
          >
            <MaterialCommunityIcons
              name="cash-multiple"
              size={16}
              color={newType === 'installment' ? colors.textInverse : colors.textTertiary}
              style={{ marginEnd: spacing.xs }}
            />
            <Text style={[styles.typeText, newType === 'installment' && styles.typeTextActive]}>Installment</Text>
          </Pressable>
        </View>

        {newType === 'installment' && (
          <TextInput
            style={styles.input}
            value={newInstallments}
            onChangeText={setNewInstallments}
            placeholder="Total installments"
            placeholderTextColor={colors.textDisabled}
            keyboardType="numeric"
          />
        )}

        <CategorySelector selected={newCategory} onSelect={setNewCategory} exclude={['other', 'subscriptions']} />

        <View style={styles.modalActions}>
          <ThemedButton
            title="Cancel"
            onPress={() => setShowAdd(false)}
            variant="secondary"
            size="md"
            style={styles.modalBtnFlex}
          />
          <ThemedButton
            title="Add"
            onPress={handleAdd}
            variant="primary"
            size="md"
            style={styles.modalBtnFlex}
          />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  pillBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  pillBadgeText: {
    ...typography.captionMedium,
    color: colors.primary,
  },
  itemCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.circle,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.bodySemiBold,
    color: colors.textPrimary,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  itemAmount: {
    ...typography.numberSmall,
    color: colors.primary,
    marginEnd: spacing.md,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.circle,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footerContainer: {
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
  },
  totalCard: {
    padding: spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.heading4,
    color: colors.textSecondary,
  },
  totalAmount: {
    ...typography.numberSmall,
    color: colors.primary,
  },
  projectionToggle: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  projectionToggleText: {
    ...typography.label,
    color: colors.primary,
  },
  projectionCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  projectionMonth: {
    ...typography.bodySemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  projectionTotal: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  projectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxs,
  },
  projectionItemName: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  projectionItemAmount: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    ...typography.captionMedium,
    color: colors.textTertiary,
  },
  typeTextActive: {
    color: colors.textInverse,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalBtnFlex: {
    flex: 1,
  },
});
