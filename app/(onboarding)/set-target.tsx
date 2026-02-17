import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Animated, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows, durations } from '@/src/core/theme';
import { ThemedCard } from '@/src/components/ThemedCard';
import { ThemedButton } from '@/src/components/ThemedButton';
import { AnimatedNumber } from '@/src/components/AnimatedNumber';
import { BottomSheet } from '@/src/components/BottomSheet';
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
  const [showConfirm, setShowConfirm] = useState(false);

  // Animated border color for inputs
  const targetBorderAnim = useRef(new Animated.Value(0)).current;
  const savingsNameBorderAnim = useRef(new Animated.Value(0)).current;
  const savingsAmountBorderAnim = useRef(new Animated.Value(0)).current;

  const animateBorder = (anim: Animated.Value, focused: boolean) => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: durations.normal,
      useNativeDriver: false,
    }).start();
  };

  const getBorderColor = (anim: Animated.Value) =>
    anim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.border, colors.primary],
    });

  const handleFinish = () => {
    setShowConfirm(true);
  };

  const confirmSetup = async () => {
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

    setShowConfirm(false);
    router.replace('/(tabs)');
  };

  const targetNum = parseFloat(target) || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Your Budget</Text>

      {baselineAvg > 0 && (
        <ThemedCard variant="primary" animated>
          <View style={styles.baselineHeader}>
            <MaterialCommunityIcons name="chart-line" size={24} color={colors.primary} />
            <Text style={styles.baselineLabel}>Your average monthly leisure spend</Text>
          </View>
          <AnimatedNumber value={baselineAvg} prefix="₪" style={styles.baselineAmount} />
          <Text style={styles.baselineHint}>
            We suggest targeting 80% of this: {formatNIS(proposedTarget)}
          </Text>
        </ThemedCard>
      )}

      <Text style={styles.label}>Monthly Leisure Target</Text>
      <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(targetBorderAnim) }]}>
        <TextInput
          style={styles.input}
          value={target}
          onChangeText={setTarget}
          placeholder="e.g. 3000"
          keyboardType="numeric"
          onFocus={() => animateBorder(targetBorderAnim, true)}
          onBlur={() => animateBorder(targetBorderAnim, false)}
        />
      </Animated.View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Optional</Text>
        <View style={styles.dividerLine} />
      </View>

      <Text style={styles.sectionTitle}>Savings Goal</Text>
      <Text style={styles.label}>What are you saving for?</Text>
      <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(savingsNameBorderAnim) }]}>
        <TextInput
          style={styles.input}
          value={savingsName}
          onChangeText={setSavingsName}
          placeholder="e.g. New laptop, vacation"
          onFocus={() => animateBorder(savingsNameBorderAnim, true)}
          onBlur={() => animateBorder(savingsNameBorderAnim, false)}
        />
      </Animated.View>

      <Text style={styles.label}>Goal Amount</Text>
      <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(savingsAmountBorderAnim) }]}>
        <TextInput
          style={styles.input}
          value={savingsAmount}
          onChangeText={setSavingsAmount}
          placeholder="e.g. 5000"
          keyboardType="numeric"
          onFocus={() => animateBorder(savingsAmountBorderAnim, true)}
          onBlur={() => animateBorder(savingsAmountBorderAnim, false)}
        />
      </Animated.View>

      <ThemedButton
        title="Start Tracking"
        onPress={handleFinish}
        variant="success"
        size="lg"
        icon="rocket-launch"
        disabled={!target}
        style={styles.finishBtn}
      />

      <BottomSheet
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Setup"
      >
        <View style={styles.confirmContent}>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Monthly target</Text>
            <Text style={styles.confirmValue}>{formatNIS(targetNum)}</Text>
          </View>
          {savingsName ? (
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Savings goal</Text>
              <Text style={styles.confirmValue}>{savingsName}</Text>
            </View>
          ) : null}
          {savingsAmount ? (
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Goal amount</Text>
              <Text style={styles.confirmValue}>{formatNIS(parseFloat(savingsAmount) || 0)}</Text>
            </View>
          ) : null}
          <View style={styles.confirmButtons}>
            <ThemedButton
              title="Go Back"
              onPress={() => setShowConfirm(false)}
              variant="secondary"
              size="lg"
              style={styles.confirmBtnHalf}
            />
            <ThemedButton
              title="Start"
              onPress={confirmSetup}
              variant="success"
              size="lg"
              style={styles.confirmBtnHalf}
            />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  baselineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  baselineLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  baselineAmount: {
    ...typography.number,
    color: colors.primary,
    marginVertical: spacing.xs,
  },
  baselineHint: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.captionMedium,
    color: colors.textTertiary,
  },
  sectionTitle: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  finishBtn: {
    marginTop: spacing.xxl,
  },
  confirmContent: {
    paddingBottom: spacing.lg,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  confirmLabel: {
    ...typography.body,
    color: colors.textTertiary,
  },
  confirmValue: {
    ...typography.bodySemiBold,
    color: colors.textPrimary,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  confirmBtnHalf: {
    flex: 1,
  },
});
