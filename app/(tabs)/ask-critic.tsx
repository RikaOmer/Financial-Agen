import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useAICritic } from '@/src/features/agent/hooks/useAICritic';
import { CriticVerdictCard } from '@/src/features/agent/components/CriticVerdict';
import { StrictnessBadge } from '@/src/features/agent/components/StrictnessBadge';
import { useBudgetStore } from '@/src/stores/budget-store';
import { insertTransaction } from '@/src/core/db/queries/transactions';
import { CategorySelector } from '@/src/components/CategorySelector';
import { formatNIS } from '@/src/utils/currency';
import { formStyles } from '@/src/styles/form-styles';
import { STRICT_MODE_THRESHOLD } from '@/src/core/constants/app-constants';

export default function AskCriticScreen() {
  const db = useSQLiteContext();
  const { verdict, status, error, evaluate, reset } = useAICritic();
  const { snapshot, refreshBudget } = useBudgetStore();

  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('food_dining');

  const priceNum = parseFloat(price) || 0;
  const isStrict = priceNum > snapshot.dailyBudget * STRICT_MODE_THRESHOLD;

  const handleEvaluate = () => {
    if (!itemName.trim() || priceNum <= 0) {
      Alert.alert('Missing Info', 'Please enter item name and price.');
      return;
    }
    evaluate(itemName.trim(), priceNum, category);
  };

  const handleBuyAnyway = async () => {
    await insertTransaction(db, {
      amount: priceNum,
      description: itemName.trim(),
      category,
      timestamp: new Date().toISOString(),
    });
    await refreshBudget(db);
    const updatedBudget = useBudgetStore.getState().snapshot.dailyBudget;
    Alert.alert('Recorded', `${formatNIS(priceNum)} added. New daily budget: ${formatNIS(updatedBudget)}`);
    resetForm();
  };

  const handleSkip = () => {
    resetForm();
  };

  const resetForm = () => {
    setItemName('');
    setPrice('');
    reset();
  };

  return (
    <ScrollView style={formStyles.container} contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
      <Text style={formStyles.budgetHint}>Daily budget: {formatNIS(snapshot.dailyBudget)}</Text>

      {!verdict && status !== 'loading' && (
        <>
          <Text style={formStyles.label}>What do you want to buy?</Text>
          <TextInput
            style={formStyles.input}
            value={itemName}
            onChangeText={setItemName}
            placeholder="e.g. Burger, Movie ticket"
            returnKeyType="next"
          />

          <Text style={formStyles.label}>Price (NIS)</Text>
          <TextInput
            style={formStyles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="numeric"
            returnKeyType="done"
          />

          <Text style={formStyles.label}>Category</Text>
          <CategorySelector selected={category} onSelect={setCategory} />

          <StrictnessBadge isStrict={isStrict} />

          <TouchableOpacity style={styles.evaluateBtn} onPress={handleEvaluate}>
            <Text style={styles.evaluateText}>Ask the Critic</Text>
          </TouchableOpacity>
        </>
      )}

      {status === 'loading' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>The Critic is thinking...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleEvaluate}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {verdict && (
        <>
          <CriticVerdictCard verdict={verdict} />
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.buyBtn} onPress={handleBuyAnyway}>
              <Text style={styles.buyText}>Buy Anyway</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  evaluateBtn: { backgroundColor: '#7c3aed', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  evaluateText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: '#64748b', marginTop: 12, fontSize: 15 },
  errorContainer: { backgroundColor: '#fef2f2', padding: 16, borderRadius: 12, marginTop: 16 },
  errorText: { color: '#dc2626', fontSize: 14 },
  retryBtn: { marginTop: 8, alignSelf: 'center' },
  retryText: { color: '#2563eb', fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  buyBtn: { flex: 1, backgroundColor: '#f59e0b', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skipBtn: { flex: 1, backgroundColor: '#e2e8f0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  skipText: { color: '#475569', fontSize: 16, fontWeight: '600' },
});
