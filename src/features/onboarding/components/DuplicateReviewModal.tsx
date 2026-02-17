import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DuplicateMatch } from '@/src/features/budget/utils/deduplication';
import { formatNIS } from '@/src/utils/currency';
import { BottomSheet } from '@/src/components/BottomSheet';
import { ThemedButton } from '@/src/components/ThemedButton';
import { colors, typography, spacing } from '@/src/core/theme';

interface Props {
  visible: boolean;
  duplicates: DuplicateMatch[];
  onConfirm: (excludedIndices: Set<number>) => void;
}

function DuplicateItem({
  match,
  isExcluded,
  onToggle,
}: {
  match: DuplicateMatch;
  isExcluded: boolean;
  onToggle: () => void;
}) {
  const opacityAnim = useRef(new Animated.Value(isExcluded ? 0.6 : 1)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: isExcluded ? 0.6 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExcluded, opacityAnim]);

  return (
    <Animated.View style={{ opacity: opacityAnim }}>
      <Pressable
        style={styles.item}
        onPress={onToggle}
        android_ripple={Platform.OS === 'android' ? { color: colors.borderLight } : undefined}
      >
        <MaterialCommunityIcons
          name={isExcluded ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
          color={isExcluded ? colors.primary : colors.textDisabled}
          style={styles.checkbox}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemDesc} numberOfLines={1}>
            {match.csvEntry.description}
          </Text>
          <Text style={styles.itemMeta}>
            {formatNIS(match.csvEntry.amount)} · {match.csvEntry.date} ·{' '}
            {Math.round(match.confidence * 100)}% match
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function DuplicateReviewModal({ visible, duplicates, onConfirm }: Props) {
  const [excluded, setExcluded] = useState<Set<number>>(
    () => new Set(duplicates.map((_, i) => i)),
  );

  const toggleIndex = (index: number) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <BottomSheet visible={visible} onClose={() => onConfirm(excluded)} title="Potential Duplicates Found">
      <Text style={styles.hint}>
        These CSV entries may already exist in your data. Checked items will be excluded from
        import.
      </Text>
      <ScrollView style={styles.list}>
        {duplicates.map((match, i) => (
          <DuplicateItem
            key={i}
            match={match}
            isExcluded={excluded.has(i)}
            onToggle={() => toggleIndex(i)}
          />
        ))}
      </ScrollView>
      <View style={styles.actions}>
        <ThemedButton
          title={`Exclude ${excluded.size} duplicate${excluded.size !== 1 ? 's' : ''} and Continue`}
          onPress={() => onConfirm(excluded)}
          variant="success"
          size="lg"
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  list: { maxHeight: 300 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  checkbox: {
    marginEnd: spacing.md,
  },
  itemInfo: { flex: 1 },
  itemDesc: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textDisabled,
    marginTop: spacing.xxs,
  },
  actions: {
    marginTop: spacing.lg,
  },
});
