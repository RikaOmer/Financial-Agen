import React, { useEffect, useRef } from 'react';
import { View, Text, Switch, Animated, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DetectedCommitment } from '@/src/types/csv';
import { formatNIS } from '@/src/utils/currency';
import { LEISURE_CATEGORIES } from '@/src/core/constants/categories';
import { ThemedCard } from '@/src/components/ThemedCard';
import { colors, typography, spacing } from '@/src/core/theme';

interface Props {
  commitment: DetectedCommitment;
  onToggle: () => void;
}

export function CommitmentCard({ commitment, onToggle }: Props) {
  const categoryLabel = LEISURE_CATEGORIES[commitment.category]?.label ?? 'Other';
  const opacityAnim = useRef(new Animated.Value(commitment.selected ? 1 : 0.4)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: commitment.selected ? 1 : 0.4,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [commitment.selected, opacityAnim]);

  const typeIcon: keyof typeof MaterialCommunityIcons.glyphMap =
    commitment.type === 'subscription' ? 'repeat' : 'cash-multiple';

  return (
    <Animated.View style={[styles.wrapper, { opacity: opacityAnim }]}>
      <ThemedCard style={styles.card}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name={typeIcon}
            size={20}
            color={colors.primary}
            style={styles.typeIcon}
          />
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
      </ThemedCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: spacing.xs },
  card: { padding: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    marginEnd: spacing.sm,
  },
  info: { flex: 1 },
  name: { ...typography.heading4, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xxs },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  amount: { ...typography.numberSmall, color: colors.primary },
  category: { ...typography.caption, color: colors.textDisabled, alignSelf: 'flex-end' },
});
