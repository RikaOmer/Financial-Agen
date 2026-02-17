import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows, durations } from '@/src/core/theme';
import { ThemedCard } from '@/src/components/ThemedCard';
import { ThemedButton } from '@/src/components/ThemedButton';
import { useCSVImport } from '@/src/features/onboarding/hooks/useCSVImport';
import { CSVPreviewTable } from '@/src/features/onboarding/components/CSVPreviewTable';
import { UnrecognizedItemModal } from '@/src/features/onboarding/components/UnrecognizedItemModal';
import { DuplicateReviewModal } from '@/src/features/onboarding/components/DuplicateReviewModal';
import { useOnboardingStore } from '@/src/stores/onboarding-store';

export default function CSVUploadScreen() {
  const db = useSQLiteContext();
  const { status, error, headers, needsManualMapping, pickAndParse, duplicates, finalizeDedup, parseProgress } = useCSVImport(db);
  const { csvTransactions, unrecognizedGroups } = useOnboardingStore();
  const classifyMerchantGroup = useOnboardingStore((s) => s.classifyMerchantGroup);
  const skipMerchantGroup = useOnboardingStore((s) => s.skipMerchantGroup);

  const [groupIndex, setGroupIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [mappingAmount, setMappingAmount] = useState('');
  const [mappingDate, setMappingDate] = useState('');
  const [mappingDesc, setMappingDesc] = useState('');

  // Results entrance animation
  const resultsOpacity = useRef(new Animated.Value(0)).current;
  const resultsTranslateY = useRef(new Animated.Value(16)).current;

  // Loading spinner rotation
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinRef = useRef<Animated.CompositeAnimation | null>(null);

  const isLoading = status === 'picking' || status === 'parsing' || status === 'analyzing';

  useEffect(() => {
    if (isLoading) {
      spinAnim.setValue(0);
      spinRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      spinRef.current.start();
    } else {
      spinRef.current?.stop();
    }
  }, [isLoading, spinAnim]);

  useEffect(() => {
    if (status === 'done' && csvTransactions.length > 0) {
      resultsOpacity.setValue(0);
      resultsTranslateY.setValue(16);
      Animated.parallel([
        Animated.timing(resultsOpacity, {
          toValue: 1,
          duration: durations.entrance,
          useNativeDriver: true,
        }),
        Animated.timing(resultsTranslateY, {
          toValue: 0,
          duration: durations.entrance,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [status, csvTransactions.length]);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleImport = async () => {
    await pickAndParse();
  };

  const handleContinue = () => {
    if (unrecognizedGroups.length > 0) {
      setGroupIndex(0);
      setShowModal(true);
    } else {
      router.push('/(onboarding)/review-commitments');
    }
  };

  const handleClassify = (category: string) => {
    classifyMerchantGroup(groupIndex, category);
    const remaining = unrecognizedGroups.length - 1;
    if (remaining > 0) {
      setGroupIndex(Math.min(groupIndex, remaining - 1));
    } else {
      setShowModal(false);
      router.push('/(onboarding)/review-commitments');
    }
  };

  const handleSkip = () => {
    skipMerchantGroup(groupIndex);
    const remaining = unrecognizedGroups.length - 1;
    if (remaining > 0) {
      setGroupIndex(Math.min(groupIndex, remaining - 1));
    } else {
      setShowModal(false);
      router.push('/(onboarding)/review-commitments');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="file-upload-outline" size={48} color={colors.primary} />
        <Text style={styles.title}>Import Bank Statements</Text>
      </View>
      <Text style={styles.hint}>
        Select one or more CSV/Excel files from your bank or credit card. You can pick multiple files at once — even from different banks or months.
      </Text>

      <ThemedButton
        title={status === 'done' ? 'Import More Files' : 'Select Bank Statements'}
        onPress={handleImport}
        variant="primary"
        size="lg"
        icon="description"
        loading={isLoading}
        disabled={isLoading}
      />

      {isLoading && (
        <ThemedCard style={styles.loadingCard}>
          <View style={styles.loadingContent}>
            <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
              <MaterialCommunityIcons name="loading" size={28} color={colors.primary} />
            </Animated.View>
            <Text style={styles.loadingText}>
              {status === 'parsing' && parseProgress ? parseProgress : status === 'analyzing' ? 'Analyzing transactions...' : 'Opening file picker...'}
            </Text>
          </View>
        </ThemedCard>
      )}

      {error && (
        <ThemedCard variant={error.startsWith('Note:') ? 'warning' : 'danger'} style={styles.errorCard}>
          <View style={styles.errorRow}>
            <MaterialCommunityIcons
              name={error.startsWith('Note:') ? 'alert-circle-outline' : 'close-circle-outline'}
              size={20}
              color={error.startsWith('Note:') ? colors.warning : colors.danger}
            />
            <Text style={[styles.errorText, { color: error.startsWith('Note:') ? colors.warningText : colors.dangerText }]}>
              {error}
            </Text>
          </View>
        </ThemedCard>
      )}

      {status === 'done' && csvTransactions.length > 0 && (
        <Animated.View style={{ opacity: resultsOpacity, transform: [{ translateY: resultsTranslateY }] }}>
          <ThemedCard style={styles.resultsCard}>
            <Text style={styles.resultTitle}>
              Found {csvTransactions.length} leisure transactions
            </Text>
            <CSVPreviewTable transactions={csvTransactions} maxRows={5} />
            {unrecognizedGroups.length > 0 && (
              <Text style={styles.unrecognizedText}>
                {unrecognizedGroups.length} merchant{unrecognizedGroups.length > 1 ? 's' : ''} need classification
              </Text>
            )}
            <ThemedButton
              title="Continue"
              onPress={handleContinue}
              variant="success"
              size="lg"
              style={styles.continueBtn}
            />
          </ThemedCard>
        </Animated.View>
      )}

      {needsManualMapping && headers.length > 0 && (
        <ThemedCard style={styles.resultsCard}>
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
                {headers.map((h, idx) => (
                  <ThemedButton
                    key={`${idx}-${h}`}
                    title={h}
                    variant={value === h ? 'primary' : 'secondary'}
                    size="sm"
                    onPress={() => setter(h)}
                    style={styles.mappingChip}
                  />
                ))}
              </View>
            </View>
          ))}
          <ThemedButton
            title="Apply Mapping"
            onPress={() => pickAndParse({ amount: mappingAmount, date: mappingDate, description: mappingDesc })}
            variant="success"
            size="lg"
            disabled={!mappingAmount || !mappingDate || !mappingDesc}
            style={styles.continueBtn}
          />
        </ThemedCard>
      )}

      <UnrecognizedItemModal
        visible={showModal}
        group={unrecognizedGroups[groupIndex] ?? null}
        remaining={unrecognizedGroups.length}
        onClassify={handleClassify}
        onSkip={handleSkip}
      />

      {status === 'dedup_review' && (
        <DuplicateReviewModal
          visible={status === 'dedup_review'}
          duplicates={duplicates}
          onConfirm={(excludedIndices) => finalizeDedup(excludedIndices)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  headerRow: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.body,
    color: colors.textTertiary,
    marginBottom: spacing.xl,
  },
  loadingCard: {
    marginTop: spacing.lg,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  errorCard: {
    marginTop: spacing.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    ...typography.body,
    flex: 1,
  },
  resultsCard: {
    marginTop: spacing.xl,
  },
  resultTitle: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  unrecognizedText: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.sm,
  },
  continueBtn: {
    marginTop: spacing.lg,
  },
  mappingHint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  mappingRow: {
    marginBottom: spacing.md,
  },
  mappingLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  mappingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mappingChip: {
    paddingVertical: 10,
  },
});
