import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import {
  getActiveCommitments,
  insertCommitment,
  deleteCommitment,
} from '@/src/core/db/queries/commitments';
import { useBudgetStore } from '@/src/stores/budget-store';
import type { Commitment } from '@/src/types/database';
import { formatNIS } from '@/src/utils/currency';
import { LEISURE_CATEGORIES, CATEGORY_KEYS } from '@/src/core/constants/categories';

export default function CommitmentsScreen() {
  const db = useSQLiteContext();
  const refreshBudget = useBudgetStore((s) => s.refreshBudget);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'subscription' | 'installment'>('subscription');
  const [newInstallments, setNewInstallments] = useState('');
  const [newCategory, setNewCategory] = useState('subscriptions');

  const load = useCallback(async () => {
    const data = await getActiveCommitments(db);
    setCommitments(data);
  }, [db]);

  useEffect(() => { load(); }, [load]);

  const subscriptions = commitments.filter((c) => c.type === 'subscription');
  const installments = commitments.filter((c) => c.type === 'installment');
  const total = commitments.reduce((sum, c) => sum + c.amount, 0);

  const sections = [
    { title: 'Subscriptions', data: subscriptions },
    { title: 'Installments', data: installments },
  ].filter((s) => s.data.length > 0);

  const handleAdd = async () => {
    const amount = parseFloat(newAmount);
    if (!newName.trim() || !amount || amount <= 0) {
      Alert.alert('Invalid', 'Please fill in name and amount.');
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
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCommitment(db, id);
          await load();
          await refreshBudget(db);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>
                {LEISURE_CATEGORIES[item.category]?.label ?? 'Other'}
                {item.remaining_installments ? ` - ${item.remaining_installments} left` : ''}
              </Text>
            </View>
            <Text style={styles.itemAmount}>{formatNIS(item.amount)}</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id, item.name)}
            >
              <Text style={styles.deleteText}>X</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No commitments yet. Add subscriptions or installments.</Text>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.totalLabel}>Total Monthly</Text>
            <Text style={styles.totalAmount}>{formatNIS(total)}</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
        <Text style={styles.addBtnText}>+ Add Commitment</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Commitment</Text>

            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Name (e.g. Netflix)" />
            <TextInput style={styles.input} value={newAmount} onChangeText={setNewAmount} placeholder="Monthly amount" keyboardType="numeric" />

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeChip, newType === 'subscription' && styles.typeChipActive]}
                onPress={() => setNewType('subscription')}
              >
                <Text style={[styles.typeText, newType === 'subscription' && styles.typeTextActive]}>Subscription</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeChip, newType === 'installment' && styles.typeChipActive]}
                onPress={() => setNewType('installment')}
              >
                <Text style={[styles.typeText, newType === 'installment' && styles.typeTextActive]}>Installment</Text>
              </TouchableOpacity>
            </View>

            {newType === 'installment' && (
              <TextInput
                style={styles.input}
                value={newInstallments}
                onChangeText={setNewInstallments}
                placeholder="Total installments"
                keyboardType="numeric"
              />
            )}

            <View style={styles.categoryGrid}>
              {CATEGORY_KEYS.filter((k) => k !== 'other').map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.catChip, newCategory === key && styles.catChipActive]}
                  onPress={() => setNewCategory(key)}
                >
                  <Text style={[styles.catText, newCategory === key && styles.catTextActive]}>
                    {LEISURE_CATEGORIES[key].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd}>
                <Text style={styles.confirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  list: { padding: 16, paddingBottom: 80 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#475569', paddingVertical: 8, backgroundColor: '#f8fafc' },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  itemMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  itemAmount: { fontSize: 16, fontWeight: '700', color: '#2563eb', marginRight: 12 },
  deleteBtn: { padding: 6 },
  deleteText: { color: '#dc2626', fontWeight: '700', fontSize: 16 },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 40 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#475569' },
  totalAmount: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  addBtn: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  typeChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeText: { color: '#64748b', fontWeight: '500' },
  typeTextActive: { color: '#fff' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  catChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  catText: { fontSize: 12, color: '#64748b' },
  catTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#e2e8f0' },
  cancelText: { color: '#475569', fontWeight: '600' },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#2563eb' },
  confirmText: { color: '#fff', fontWeight: '600' },
});
