import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import { useSettingsStore } from '@/src/stores/settings-store';
import { useBudgetStore } from '@/src/stores/budget-store';
import { getSetting, setSetting, getBigEvents } from '@/src/core/db/queries/settings';
import { createBigEvent } from '@/src/features/budget/utils/big-event';
import { formatNIS } from '@/src/utils/currency';
import { isValidApiKey } from '@/src/utils/validation';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import type { BigEvent } from '@/src/types/budget';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { apiKey, loadApiKey, setApiKey } = useSettingsStore();
  const { refreshBudget, snapshot } = useBudgetStore();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [savingsNameInput, setSavingsNameInput] = useState('');
  const [savingsAmountInput, setSavingsAmountInput] = useState('');
  const [bigEventName, setBigEventName] = useState('');
  const [bigEventAmount, setBigEventAmount] = useState('');
  const [bigEvents, setBigEvents] = useState<BigEvent[]>([]);

  useEffect(() => {
    loadApiKey();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const target = await getSetting(db, 'monthly_leisure_target');
    const goalName = await getSetting(db, 'savings_goal_name');
    const goalAmount = await getSetting(db, 'savings_goal_amount');
    const eventsJson = await getBigEvents(db);

    if (target) setTargetInput(target);
    if (goalName) setSavingsNameInput(goalName);
    if (goalAmount) setSavingsAmountInput(goalAmount);
    try { setBigEvents(JSON.parse(eventsJson)); } catch { setBigEvents([]); }
  };

  const handleSaveApiKey = async () => {
    if (!isValidApiKey(apiKeyInput.trim())) {
      Alert.alert('Invalid Key', 'API key must start with "sk-ant-" and be at least 20 characters.');
      return;
    }
    await setApiKey(apiKeyInput.trim());
    Alert.alert('Saved', 'API key stored securely.');
    setApiKeyInput('');
  };

  const handleSaveTarget = async () => {
    const num = parseFloat(targetInput);
    if (!num || num <= 0) return;
    await setSetting(db, 'monthly_leisure_target', String(num));
    useSettingsStore.getState().setMonthlyTarget(num);
    await refreshBudget(db);
    Alert.alert('Saved', `Monthly target set to ${formatNIS(num)}`);
  };

  const handleSaveSavingsGoal = async () => {
    if (savingsNameInput.trim() && savingsAmountInput) {
      await setSetting(db, 'savings_goal_name', savingsNameInput.trim());
      await setSetting(db, 'savings_goal_amount', savingsAmountInput);
      Alert.alert('Saved', 'Savings goal updated.');
    }
  };

  const handleAddBigEvent = async () => {
    const amount = parseFloat(bigEventAmount);
    if (!bigEventName.trim() || !amount || amount <= 0) {
      Alert.alert('Invalid', 'Enter event name and amount.');
      return;
    }
    const event = createBigEvent(bigEventName.trim(), amount, new Date().toISOString());
    const updated = [...bigEvents, event];
    const totalAmortization = updated.reduce((sum, e) => sum + (e.amortizedDaily || 0), 0);
    if (snapshot.dailyBudget > 0 && totalAmortization > snapshot.dailyBudget * 0.9) {
      Alert.alert(
        'Warning',
        'Adding this event would consume most of your daily budget. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Anyway',
            onPress: async () => {
              await saveBigEvent(updated);
            },
          },
        ]
      );
      return;
    }
    await saveBigEvent(updated);
  };

  const saveBigEvent = async (updated: BigEvent[]) => {
    await setSetting(db, 'big_events', JSON.stringify(updated));
    setBigEvents(updated);
    setBigEventName('');
    setBigEventAmount('');
    await refreshBudget(db);
    Alert.alert('Added', `Event will be amortized over remaining days.`);
  };

  const handleDeleteBigEvent = (id: string) => {
    Alert.alert('Delete Event', 'Remove this big event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = bigEvents.filter((e) => e.id !== id);
          await setSetting(db, 'big_events', JSON.stringify(updated));
          setBigEvents(updated);
          await refreshBudget(db);
        },
      },
    ]);
  };

  const handleReimport = () => {
    useOnboardingStore.getState().reset();
    router.push('/(onboarding)/csv-upload');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>API Key</Text>
      <Text style={styles.hint}>
        {apiKey ? 'Key stored securely. Enter new key to replace.' : 'Enter your Anthropic API key for AI Critic.'}
      </Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={apiKeyInput}
          onChangeText={setApiKeyInput}
          placeholder="sk-ant-..."
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.smallBtn} onPress={handleSaveApiKey}>
          <Text style={styles.smallBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Monthly Target</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={targetInput}
          onChangeText={setTargetInput}
          placeholder="e.g. 3000"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.smallBtn} onPress={handleSaveTarget}>
          <Text style={styles.smallBtnText}>Update</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Savings Goal</Text>
      <TextInput
        style={styles.input}
        value={savingsNameInput}
        onChangeText={setSavingsNameInput}
        placeholder="Goal name"
      />
      <View style={[styles.row, { marginTop: 8 }]}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={savingsAmountInput}
          onChangeText={setSavingsAmountInput}
          placeholder="Amount"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.smallBtn} onPress={handleSaveSavingsGoal}>
          <Text style={styles.smallBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Big Events</Text>
      <Text style={styles.hint}>Add a one-time expense to amortize over the rest of the month.</Text>
      <TextInput
        style={styles.input}
        value={bigEventName}
        onChangeText={setBigEventName}
        placeholder="Event name (e.g. Wedding)"
      />
      <View style={[styles.row, { marginTop: 8 }]}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={bigEventAmount}
          onChangeText={setBigEventAmount}
          placeholder="Amount"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.smallBtn} onPress={handleAddBigEvent}>
          <Text style={styles.smallBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
      {bigEvents.map((e) => (
        <View key={e.id} style={styles.eventRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventName}>{e.name}</Text>
            <Text style={styles.eventAmount}>{formatNIS(e.amount)} ({formatNIS(e.amortizedDaily)}/day)</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteBigEvent(e.id)}
            style={styles.eventDeleteBtn}
          >
            <Text style={styles.eventDeleteText}>X</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.reimportBtn} onPress={handleReimport}>
        <Text style={styles.reimportText}>Re-import CSV</Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Current Budget</Text>
        <Text style={styles.infoLine}>Daily: {formatNIS(snapshot.dailyBudget)}</Text>
        <Text style={styles.infoLine}>Wishlist Fund: {formatNIS(snapshot.wishlistFund)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, paddingBottom: 40 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginTop: 20, marginBottom: 8 },
  hint: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  smallBtn: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  smallBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  eventName: { fontSize: 14, color: '#374151' },
  eventAmount: { fontSize: 14, color: '#2563eb', fontWeight: '500' },
  eventDeleteBtn: { padding: 6, marginLeft: 8 },
  eventDeleteText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  reimportBtn: { marginTop: 24, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  reimportText: { color: '#64748b', fontSize: 15 },
  infoCard: { backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, marginTop: 24 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#2563eb', marginBottom: 8 },
  infoLine: { fontSize: 14, color: '#1e40af', paddingVertical: 2 },
});
