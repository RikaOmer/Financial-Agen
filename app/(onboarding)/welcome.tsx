import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>💰</Text>
        <Text style={styles.title}>Financial Twin</Text>
        <Text style={styles.subtitle}>
          Take control of your leisure spending with AI-powered insights
        </Text>
      </View>

      <View style={styles.features}>
        <Text style={styles.feature}>Analyze your spending DNA from bank CSVs</Text>
        <Text style={styles.feature}>Track subscriptions & installments</Text>
        <Text style={styles.feature}>Get AI critique before every purchase</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(onboarding)/csv-upload')}
        >
          <Text style={styles.primaryText}>Get Started with CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(onboarding)/set-target')}
        >
          <Text style={styles.secondaryText}>Skip CSV - Set Budget Manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: '#1a1a1a' },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 24 },
  features: { marginBottom: 40, paddingHorizontal: 16 },
  feature: { fontSize: 15, color: '#475569', paddingVertical: 8, paddingLeft: 12, borderLeftWidth: 3, borderLeftColor: '#2563eb', marginBottom: 8 },
  actions: { gap: 12 },
  primaryBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  secondaryBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  secondaryText: { color: '#64748b', fontSize: 15 },
});
