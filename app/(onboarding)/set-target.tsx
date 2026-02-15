import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import { useSettingsStore } from '@/src/stores/settings-store';
import { setSetting } from '@/src/core/db/queries/settings';
import { formatNIS } from '@/src/utils/currency';

export default function SetTargetScreen() {
  const db = useSQLiteContext();
  const { baselineAvg, proposedTarget } = useOnboardingStore();
  const setMonthlyTarget = useSettingsStore((s) => s.setMonthlyTarget);

  const [target, setTarget] = useState(proposedTarget > 0 ? String(proposedTarget) : '');
  const [savingsName, setSavingsName] = useState('');
  const [savingsAmount, setSavingsAmount] = useState('');

  const handleFinish = async () => {
    const targetNum = parseFloat(target) || 0;
    await setSetting(db, 'monthly_leisure_target', String(targetNum));
    await setSetting(db, 'baseline_avg', String(baselineAvg));
    setMonthlyTarget(targetNum);

    if (savingsName && savingsAmount) {
      await setSetting(db, 'savings_goal_name', savingsName);
      await setSetting(db, 'savings_goal_amount', savingsAmount);
    }

    await setSetting(db, 'onboarding_completed', 'true');
    await setSetting(db, 'last_active_month', new Date().toISOString().substring(0, 7));

    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Your Budget</Text>

      {baselineAvg > 0 && (
        <View style={styles.baselineCard}>
          <Text style={styles.baselineLabel}>Your average monthly leisure spend</Text>
          <Text style={styles.baselineAmount}>{formatNIS(baselineAvg)}</Text>
          <Text style={styles.baselineHint}>
            We suggest targeting 80% of this: {formatNIS(proposedTarget)}
          </Text>
        </View>
      )}

      <Text style={styles.label}>Monthly Leisure Target</Text>
      <TextInput
        style={styles.input}
        value={target}
        onChangeText={setTarget}
        placeholder="e.g. 3000"
        keyboardType="numeric"
      />

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Savings Goal (Optional)</Text>
      <Text style={styles.label}>What are you saving for?</Text>
      <TextInput
        style={styles.input}
        value={savingsName}
        onChangeText={setSavingsName}
        placeholder="e.g. New laptop, vacation"
      />

      <Text style={styles.label}>Goal Amount</Text>
      <TextInput
        style={styles.input}
        value={savingsAmount}
        onChangeText={setSavingsAmount}
        placeholder="e.g. 5000"
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.finishBtn, !target && styles.finishBtnDisabled]}
        onPress={handleFinish}
        disabled={!target}
      >
        <Text style={styles.finishText}>Start Tracking</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  baselineCard: { backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, marginBottom: 24 },
  baselineLabel: { fontSize: 14, color: '#64748b' },
  baselineAmount: { fontSize: 28, fontWeight: '700', color: '#2563eb', marginVertical: 4 },
  baselineHint: { fontSize: 13, color: '#64748b' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  finishBtn: { backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  finishBtnDisabled: { opacity: 0.5 },
  finishText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
