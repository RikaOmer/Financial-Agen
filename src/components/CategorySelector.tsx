import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LEISURE_CATEGORIES, CATEGORY_KEYS } from '@/src/core/constants/categories';
import { CATEGORY_ICONS } from '@/src/core/constants/category-icons';
import { colors, typography, radius, spacing } from '@/src/core/theme';

interface Props {
  selected: string;
  onSelect: (key: string) => void;
  exclude?: string[];
}

function CategoryChip({
  categoryKey,
  label,
  isSelected,
  onPress,
}: {
  categoryKey: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.05 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [isSelected, scaleAnim]);

  const iconName = CATEGORY_ICONS[categoryKey] ?? 'dots-horizontal';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        android_ripple={Platform.OS === 'android' ? { color: colors.primaryBg } : undefined}
        style={[styles.chip, isSelected && styles.chipActive]}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={16}
          color={isSelected ? colors.textInverse : colors.textTertiary}
          style={styles.chipIcon}
        />
        <Text style={[styles.text, isSelected && styles.textActive]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function CategorySelector({ selected, onSelect, exclude = ['other'] }: Props) {
  const keys = CATEGORY_KEYS.filter((k) => !exclude.includes(k));

  return (
    <View style={styles.container}>
      {keys.map((key) => (
        <CategoryChip
          key={key}
          categoryKey={key}
          label={LEISURE_CATEGORIES[key].label}
          isSelected={selected === key}
          onPress={() => onSelect(key)}
        />
      ))}
    </View>
  );
}

export { CATEGORY_ICONS } from '@/src/core/constants/category-icons';

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.xxl,
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipIcon: {
    marginEnd: spacing.xs,
  },
  text: {
    ...typography.captionMedium,
    color: colors.textTertiary,
  },
  textActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
});
