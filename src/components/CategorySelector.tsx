import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LEISURE_CATEGORIES, CATEGORY_KEYS } from '@/src/core/constants/categories';

interface Props {
  selected: string;
  onSelect: (key: string) => void;
  exclude?: string[];
}

export function CategorySelector({ selected, onSelect, exclude = ['other'] }: Props) {
  const keys = CATEGORY_KEYS.filter((k) => !exclude.includes(k));

  return (
    <View style={styles.container}>
      {keys.map((key) => (
        <TouchableOpacity
          key={key}
          style={[styles.chip, selected === key && styles.chipActive]}
          onPress={() => onSelect(key)}
        >
          <Text style={[styles.text, selected === key && styles.textActive]}>
            {LEISURE_CATEGORIES[key].label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  text: { fontSize: 13, color: '#64748b' },
  textActive: { color: '#fff', fontWeight: '600' },
});
