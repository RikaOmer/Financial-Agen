import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useCSVImport } from '@/src/features/onboarding/hooks/useCSVImport';
import { CSVPreviewTable } from '@/src/features/onboarding/components/CSVPreviewTable';
import { UnrecognizedItemModal } from '@/src/features/onboarding/components/UnrecognizedItemModal';
import { useOnboardingStore } from '@/src/stores/onboarding-store';

export default function CSVUploadScreen() {
  const { status, error, headers, needsManualMapping, pickAndParse } = useCSVImport();
  const { csvTransactions, unrecognizedItems } = useOnboardingStore();
  const classifyUnrecognized = useOnboardingStore((s) => s.classifyUnrecognized);

  const [modalIndex, setModalIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [mappingAmount, setMappingAmount] = useState('');
  const [mappingDate, setMappingDate] = useState('');
  const [mappingDesc, setMappingDesc] = useState('');

  const handleImport = async () => {
    await pickAndParse();
  };

  const handleContinue = () => {
    if (unrecognizedItems.length > 0) {
      setModalIndex(0);
      setShowModal(true);
    } else {
      router.push('/(onboarding)/review-commitments');
    }
  };

  const handleClassify = (category: string) => {
    classifyUnrecognized(modalIndex, category);
    if (modalIndex + 1 < unrecognizedItems.length) {
      setModalIndex(modalIndex + 1);
    } else {
      setShowModal(false);
      router.push('/(onboarding)/review-commitments');
    }
  };

  const handleSkip = () => {
    if (modalIndex + 1 < unrecognizedItems.length) {
      setModalIndex(modalIndex + 1);
    } else {
      setShowModal(false);
      router.push('/(onboarding)/review-commitments');
    }
  };

  const isLoading = status === 'picking' || status === 'parsing' || status === 'analyzing';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import Bank Statement</Text>
      <Text style={styles.hint}>
        Upload a CSV file from your bank or credit card to analyze your spending patterns.
      </Text>

      <TouchableOpacity
        style={[styles.importBtn, isLoading && styles.importBtnDisabled]}
        onPress={handleImport}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.importText}>
            {status === 'done' ? 'Import Another CSV' : 'Select CSV File'}
          </Text>
        )}
      </TouchableOpacity>

      {status === 'analyzing' && (
        <Text style={styles.statusText}>Analyzing transactions...</Text>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {status === 'done' && csvTransactions.length > 0 && (
        <View style={styles.results}>
          <Text style={styles.resultTitle}>
            Found {csvTransactions.length} leisure transactions
          </Text>
          <CSVPreviewTable transactions={csvTransactions} maxRows={5} />
          {unrecognizedItems.length > 0 && (
            <Text style={styles.unrecognizedText}>
              {unrecognizedItems.length} items need classification
            </Text>
          )}
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}

      {needsManualMapping && headers.length > 0 && (
        <View style={styles.results}>
          <Text style={styles.resultTitle}>Could not auto-detect columns</Text>
          <Text style={styles.mappingHint}>Select which column contains each field:</Text>
          {[
            { label: 'Amount', value: mappingAmount, setter: setMappingAmount },
            { label: 'Date', value: mappingDate, setter: setMappingDate },
            { label: 'Description', value: mappingDesc, setter: setMappingDesc },
          ].map(({ label, value, setter }) => (
            <View key={label} style={styles.mappingRow}>
              <Text style={styles.mappingLabel}>{label}:</Text>
              <View style={styles.mappingChips}>
                {headers.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.mappingChip, value === h && styles.mappingChipActive]}
                    onPress={() => setter(h)}
                  >
                    <Text style={[styles.mappingChipText, value === h && styles.mappingChipTextActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.continueBtn, (!mappingAmount || !mappingDate || !mappingDesc) && styles.importBtnDisabled]}
            disabled={!mappingAmount || !mappingDate || !mappingDesc}
            onPress={() => pickAndParse({ amount: mappingAmount, date: mappingDate, description: mappingDesc })}
          >
            <Text style={styles.continueText}>Apply Mapping</Text>
          </TouchableOpacity>
        </View>
      )}

      <UnrecognizedItemModal
        visible={showModal}
        item={unrecognizedItems[modalIndex] ?? null}
        onClassify={handleClassify}
        onSkip={handleSkip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  hint: { fontSize: 15, color: '#64748b', lineHeight: 22, marginBottom: 24 },
  importBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  importBtnDisabled: { opacity: 0.6 },
  importText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statusText: { color: '#2563eb', marginTop: 12, textAlign: 'center' },
  errorText: { color: '#dc2626', marginTop: 12 },
  results: { marginTop: 24 },
  resultTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  unrecognizedText: { color: '#f59e0b', marginTop: 8 },
  continueBtn: { backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  mappingHint: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  mappingRow: { marginBottom: 12 },
  mappingLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  mappingChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mappingChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  mappingChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  mappingChipText: { fontSize: 12, color: '#64748b' },
  mappingChipTextActive: { color: '#fff', fontWeight: '600' },
});
