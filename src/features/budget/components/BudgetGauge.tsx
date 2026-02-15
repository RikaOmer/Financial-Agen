import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatNIS } from '@/src/utils/currency';

interface Props {
  dailyBudget: number;
  spentToday?: number;
  monthlyTarget: number;
  spentThisMonth: number;
}

function getColor(ratio: number): string {
  if (ratio >= 0.7) return '#16a34a'; // green - healthy
  if (ratio >= 0.4) return '#f59e0b'; // amber - caution
  return '#dc2626'; // red - danger
}

export function BudgetGauge({ dailyBudget, spentToday = 0, monthlyTarget, spentThisMonth }: Props) {
  const remaining = Math.max(0, dailyBudget - spentToday);
  const monthlyRatio = monthlyTarget > 0 ? 1 - spentThisMonth / monthlyTarget : 1;
  const color = getColor(monthlyRatio);

  const percentage = monthlyTarget > 0
    ? Math.round((1 - spentThisMonth / monthlyTarget) * 100)
    : 100;

  return (
    <View style={styles.container}>
      <View style={[styles.gauge, { borderColor: color }]}>
        <Text style={[styles.amount, { color }]}>{formatNIS(remaining)}</Text>
        <Text style={styles.label}>left today</Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.max(0, Math.min(100, percentage))}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{percentage}% of monthly budget remaining</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 16 },
  gauge: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  amount: { fontSize: 28, fontWeight: '800' },
  label: { fontSize: 14, color: '#64748b', marginTop: 4 },
  progressContainer: { width: '100%', marginTop: 8 },
  progressBg: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6 },
});
