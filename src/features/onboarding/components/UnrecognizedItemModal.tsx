import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NormalizedTransaction } from '@/src/types/csv';
import { LEISURE_CATEGORIES, CATEGORY_KEYS } from '@/src/core/constants/categories';
import { formatNIS } from '@/src/utils/currency';

interface Props {
  visible: boolean;
  item: NormalizedTransaction | null;
  onClassify: (category: string) => void;
  onSkip: () => void;
}

export function UnrecognizedItemModal({ visible, item, onClassify, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.modal, { paddingBottom: Math.max(24, insets.bottom) }]}>
          <Text style={styles.title}>Classify Transaction</Text>
          <Text style={styles.description}>
            {item.description} - {formatNIS(item.amount)}
          </Text>
          <Text style={styles.subtitle}>Select a category:</Text>
          <ScrollView style={styles.categories}>
            {CATEGORY_KEYS.filter((k) => k !== 'other').map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.categoryBtn}
                onPress={() => onClassify(key)}
              >
                <Text style={styles.categoryText}>
                  {LEISURE_CATEGORIES[key].label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipText}>Skip (Not Leisure)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  description: { fontSize: 16, color: '#444', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 16, marginBottom: 8 },
  categories: { maxHeight: 250 },
  categoryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
    marginBottom: 8,
  },
  categoryText: { fontSize: 15, color: '#2563eb', fontWeight: '500' },
  actions: { marginTop: 16, alignItems: 'center' },
  skipBtn: { paddingVertical: 12 },
  skipText: { fontSize: 15, color: '#999' },
});
