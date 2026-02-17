import React from 'react';
import { View, Text, Pressable, ScrollView, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MerchantGroup } from '@/src/stores/onboarding-store';
import { LEISURE_CATEGORIES, CATEGORY_KEYS } from '@/src/core/constants/categories';
import { CATEGORY_ICONS } from '@/src/core/constants/category-icons';
import { formatNIS } from '@/src/utils/currency';
import { BottomSheet } from '@/src/components/BottomSheet';
import { ThemedButton } from '@/src/components/ThemedButton';
import { colors, typography, radius, spacing } from '@/src/core/theme';

interface Props {
  visible: boolean;
  group: MerchantGroup | null;
  remaining: number;
  onClassify: (category: string) => void;
  onSkip: () => void;
}

export function UnrecognizedItemModal({ visible, group, remaining, onClassify, onSkip }: Props) {
  if (!group) return null;

  const count = group.transactions.length;
  const categories = CATEGORY_KEYS.filter((k) => k !== 'other');

  return (
    <BottomSheet visible={visible} onClose={onSkip} title="Classify Merchant">
      <View style={styles.headerRow}>
        <Text style={styles.badge}>{remaining} left</Text>
      </View>
      <Text style={styles.merchantName}>{group.name}</Text>
      <Text style={styles.description}>
        {count} transaction{count > 1 ? 's' : ''} — total {formatNIS(group.totalAmount)}
      </Text>
      <Text style={styles.subtitle}>Select a category:</Text>
      <ScrollView style={styles.scrollArea}>
        <View style={styles.grid}>
          {categories.map((key) => {
            const iconName = CATEGORY_ICONS[key] ?? 'dots-horizontal';
            return (
              <Pressable
                key={key}
                style={styles.categoryBtn}
                onPress={() => onClassify(key)}
                android_ripple={Platform.OS === 'android' ? { color: colors.primaryBg } : undefined}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={20}
                  color={colors.primary}
                  style={styles.categoryIcon}
                />
                <Text style={styles.categoryText}>{LEISURE_CATEGORIES[key].label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <ThemedButton
          title="Skip (Not Leisure)"
          onPress={onSkip}
          variant="ghost"
          size="md"
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  badge: {
    ...typography.captionMedium,
    color: colors.textTertiary,
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  merchantName: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  description: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.label,
    color: colors.textTertiary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  scrollArea: { maxHeight: 250 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryBg,
  },
  categoryIcon: {
    marginEnd: spacing.sm,
  },
  categoryText: {
    ...typography.bodyMedium,
    color: colors.primary,
    flex: 1,
  },
  actions: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
});
