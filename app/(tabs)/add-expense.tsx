import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { insertTransaction } from '@/src/core/db/queries/transactions';
import { useBudgetStore } from '@/src/stores/budget-store';
import { LEISURE_CATEGORIES, CATEGORY_KEYS } from '@/src/core/constants/categories';
import { formatNIS } from '@/src/utils/currency';
import { formatDate } from '@/src/utils/date';

export default function AddExpenseScreen() {
  const db = useSQLiteContext();
  const refreshBudget = useBudgetStore((s) => s.refreshBudget);
  const dailyBudget = useBudgetStore((s) => s.snapshot.dailyBudget);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('food_dining');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please enter a description.');
      return;
    }

    setSaving(true);
    try {
      await insertTransaction(db, {
        amount: num,
        description: description.trim(),
        category,
        timestamp: new Date().toISOString(),
      });
      await refreshBudget(db);

      Alert.alert(
        'Expense Added',
        `${formatNIS(num)} recorded. New daily budget: ${formatNIS(dailyBudget - num > 0 ? dailyBudget - num : 0)}`
      );
      setAmount('');
      setDescription('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.budgetHint}>
        Today's budget: {formatNIS(dailyBudget)}
      </Text>

      <Text style={styles.label}>Amount (NIS)</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="numeric"
        autoFocus
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="What did you spend on?"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categories}>
        {CATEGORY_KEYS.filter((k) => k !== 'other').map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.categoryChip, category === key && styles.categoryChipActive]}
            onPress={() => setCategory(key)}
          >
            <Text
              style={[styles.categoryText, category === key && styles.categoryTextActive]}
            >
              {LEISURE_CATEGORIES[key].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveText}>{saving ? 'Saving...' : 'Add Expense'}</Text>
      </TouchableOpacity>

      <Text style={styles.dateText}>
        Date: {formatDate(new Date())}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, paddingBottom: 40 },
  budgetHint: { fontSize: 15, color: '#2563eb', fontWeight: '600', marginBottom: 20, textAlign: 'center', backgroundColor: '#eff6ff', padding: 12, borderRadius: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  categoryChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  categoryText: { fontSize: 13, color: '#64748b' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  dateText: { textAlign: 'center', color: '#94a3b8', marginTop: 12, fontSize: 13 },
});
