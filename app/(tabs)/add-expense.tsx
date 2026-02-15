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
import { CategorySelector } from '@/src/components/CategorySelector';
import { formatNIS } from '@/src/utils/currency';
import { formatDate } from '@/src/utils/date';
import { isValidAmount, isValidDescription } from '@/src/utils/validation';
import { formStyles } from '@/src/styles/form-styles';

export default function AddExpenseScreen() {
  const db = useSQLiteContext();
  const refreshBudget = useBudgetStore((s) => s.refreshBudget);
  const dailyBudget = useBudgetStore((s) => s.snapshot.dailyBudget);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('food_dining');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!isValidAmount(amount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!isValidDescription(description)) {
      Alert.alert('Missing Description', 'Please enter a description (max 200 chars).');
      return;
    }
    const num = parseFloat(amount);

    setSaving(true);
    try {
      await insertTransaction(db, {
        amount: num,
        description: description.trim(),
        category,
        timestamp: new Date().toISOString(),
      });
      await refreshBudget(db);
      const updatedBudget = useBudgetStore.getState().snapshot.dailyBudget;

      Alert.alert(
        'Expense Added',
        `${formatNIS(num)} recorded. New daily budget: ${formatNIS(updatedBudget)}`
      );
      setAmount('');
      setDescription('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={formStyles.container} contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
      <Text style={formStyles.budgetHint}>
        Today's budget: {formatNIS(dailyBudget)}
      </Text>

      <Text style={formStyles.label}>Amount (NIS)</Text>
      <TextInput
        style={formStyles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="numeric"
        returnKeyType="next"
        autoFocus
      />

      <Text style={formStyles.label}>Description</Text>
      <TextInput
        style={formStyles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="What did you spend on?"
        returnKeyType="done"
      />

      <Text style={formStyles.label}>Category</Text>
      <CategorySelector selected={category} onSelect={setCategory} />

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
  saveBtn: { backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  dateText: { textAlign: 'center', color: '#64748b', marginTop: 12, fontSize: 13 },
});
