import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import type { DuplicateMatch } from '@/src/features/budget/utils/deduplication';
import { formatNIS } from '@/src/utils/currency';

interface Props {
  visible: boolean;
  duplicates: DuplicateMatch[];
  onConfirm: (excludedIndices: Set<number>) => void;
}

export function DuplicateReviewModal({ visible, duplicates, onConfirm }: Props) {
  const [excluded, setExcluded] = useState<Set<number>>(() => new Set(duplicates.map((_, i) => i)));

  const toggleIndex = (index: number) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Potential Duplicates Found</Text>
          <Text style={styles.hint}>
            These CSV entries may already exist in your data. Checked items will be excluded from import.
          </Text>
          <ScrollView style={styles.list}>
            {duplicates.map((match, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.item, excluded.has(i) && styles.itemExcluded]}
                onPress={() => toggleIndex(i)}
              >
                <View style={styles.checkbox}>
                  {excluded.has(i) && <View style={styles.checkboxInner} />}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemDesc} numberOfLines={1}>
                    {match.csvEntry.description}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {formatNIS(match.csvEntry.amount)} · {match.csvEntry.date} · {Math.round(match.confidence * 100)}% match
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => onConfirm(excluded)}
          >
            <Text style={styles.confirmText}>
              Exclude {excluded.size} duplicate{excluded.size !== 1 ? 's' : ''} and Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  hint: { fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 18 },
  list: { maxHeight: 300 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemExcluded: { opacity: 0.6 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#2563eb', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxInner: { width: 12, height: 12, borderRadius: 2, backgroundColor: '#2563eb' },
  itemInfo: { flex: 1 },
  itemDesc: { fontSize: 14, color: '#374151', fontWeight: '500' },
  itemMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  confirmBtn: { backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
