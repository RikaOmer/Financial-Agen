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
import { LEISURE_CATEGORIES, CATEGORY_KEYS } from '@/src/core/constants/categories';
import { formatNIS } from '@/src/utils/currency';

export default function AskCriticScreen() {
  const db = useSQLiteContext();
  const { verdict, status, error, evaluate, reset } = useAICritic();
  const { snapshot, refreshBudget } = useBudgetStore();

  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('food_dining');

  const priceNum = parseFloat(price) || 0;
  const isStrict = priceNum > snapshot.dailyBudget * 1.5;

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
    Alert.alert('Recorded', `${formatNIS(priceNum)} added to today's expenses.`);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.budgetHint}>Daily budget: {formatNIS(snapshot.dailyBudget)}</Text>

      {!verdict && status !== 'loading' && (
        <>
          <Text style={styles.label}>What do you want to buy?</Text>
          <TextInput
            style={styles.input}
            value={itemName}
            onChangeText={setItemName}
            placeholder="e.g. Burger, Movie ticket"
          />

          <Text style={styles.label}>Price (NIS)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.categories}>
            {CATEGORY_KEYS.filter((k) => k !== 'other').map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.categoryChip, category === key && styles.categoryChipActive]}
                onPress={() => setCategory(key)}
              >
                <Text style={[styles.categoryText, category === key && styles.categoryTextActive]}>
                  {LEISURE_CATEGORIES[key].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
