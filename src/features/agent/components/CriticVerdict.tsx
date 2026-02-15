import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CriticVerdict as VerdictType } from '@/src/types/agent';

interface Props {
  verdict: VerdictType;
}

const RECOMMENDATION_CONFIG = {
  approve: { color: '#16a34a', bg: '#f0fdf4', label: 'Go For It', icon: '✓' },
  consider: { color: '#f59e0b', bg: '#fffbeb', label: 'Think Twice', icon: '?' },
  reject: { color: '#dc2626', bg: '#fef2f2', label: 'Skip It', icon: '✕' },
};

const ASSESSMENT_LABELS: Record<string, string> = {
  great_deal: 'Great Deal',
  fair: 'Fair Price',
  overpriced: 'Overpriced',
  luxury: 'Luxury',
};

export function CriticVerdictCard({ verdict }: Props) {
  const config = RECOMMENDATION_CONFIG[verdict.recommendation];

  return (
    <View style={[styles.card, { backgroundColor: config.bg, borderColor: config.color }]}>
      <View style={styles.header}>
        <Text style={[styles.icon, { color: config.color }]}>{config.icon}</Text>
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
        <Text style={styles.assessment}>
          {ASSESSMENT_LABELS[verdict.valueAssessment] ?? verdict.valueAssessment}
        </Text>
      </View>

      <Text style={styles.reasoning}>{verdict.reasoning}</Text>

      {verdict.alternativeSuggestion && (
        <View style={styles.altContainer}>
          <Text style={styles.altLabel}>Alternative:</Text>
          <Text style={styles.altText}>{verdict.alternativeSuggestion}</Text>
        </View>
      )}

      <View style={styles.confidenceRow}>
        <Text style={styles.confidenceLabel}>Confidence:</Text>
        <View style={styles.confidenceBar}>
          <View
            style={[
              styles.confidenceFill,
              { width: `${verdict.confidence * 100}%`, backgroundColor: config.color },
            ]}
          />
        </View>
        <Text style={styles.confidenceValue}>{Math.round(verdict.confidence * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 20, borderWidth: 2, marginVertical: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { fontSize: 24, fontWeight: '700', marginRight: 8 },
  label: { fontSize: 20, fontWeight: '700', flex: 1 },
  assessment: { fontSize: 13, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  reasoning: { fontSize: 15, color: '#374151', lineHeight: 22 },
  altContainer: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.6)', padding: 12, borderRadius: 8 },
  altLabel: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  altText: { fontSize: 14, color: '#374151', marginTop: 2 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  confidenceLabel: { fontSize: 12, color: '#64748b', marginRight: 8 },
  confidenceBar: { flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' },
  confidenceFill: { height: '100%', borderRadius: 3 },
  confidenceValue: { fontSize: 12, color: '#64748b', marginLeft: 8, width: 35 },
});
