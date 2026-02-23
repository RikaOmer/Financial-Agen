import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Animated,
  StyleSheet,
  Easing,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { insertTransaction } from '@/src/core/db/queries/transactions';
import { useBudgetStore } from '@/src/stores/budget-store';
import { CategorySelector } from '@/src/components/CategorySelector';
import { ThemedCard } from '@/src/components/ThemedCard';
import { ThemedButton } from '@/src/components/ThemedButton';
import { AnimatedNumber } from '@/src/components/AnimatedNumber';
import { useToast } from '@/src/components/Toast';
import { formatDate } from '@/src/utils/date';
import { formatNIS } from '@/src/utils/currency';
import { isValidAmount, isValidDescription } from '@/src/utils/validation';
import { formStyles } from '@/src/styles/form-styles';
import { colors, typography, spacing, radius, durations } from '@/src/core/theme';

export default function AddExpenseScreen() {
  const db = useSQLiteContext();
  const { showToast } = useToast();
  const refreshBudget = useBudgetStore((s) => s.refreshBudget);
  const dailyBudget = useBudgetStore((s) => s.snapshot.dailyBudget);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('food_dining');
  const [saving, setSaving] = useState(false);

  // Success check animation
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  const playSuccessAnimation = () => {
    checkScale.setValue(0);
    checkOpacity.setValue(1);
    Animated.sequence([
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(checkOpacity, {
        toValue: 0,
        duration: 300,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSave = async () => {
    if (!isValidAmount(amount)) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }
    if (!isValidDescription(description)) {
      showToast('Please enter a description (max 200 chars).', 'error');
      return;
    }
    const num = parseFloat(amount);

    setSaving(true);
    try {
      await insertTransaction(db, {
        amount: num,
        description: description.trim(),
        category,
        timestamp: new Date().toISOString(),
      });
      await refreshBudget(db);

      playSuccessAnimation();
      showToast('Expense added!', 'success');
      setAmount('');
      setDescription('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={formStyles.container} contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
      {/* Budget hint card */}
      <ThemedCard variant="primary" style={styles.budgetCard}>
        <View style={styles.budgetCardInner}>
          <MaterialCommunityIcons name="gauge" size={24} color={colors.primary} />
          <View style={styles.budgetCardText}>
            <Text style={styles.budgetLabel}>Today's Budget</Text>
            <AnimatedNumber value={dailyBudget} prefix="₪" style={styles.budgetValue} />
          </View>
        </View>
      </ThemedCard>

      <Text style={formStyles.label}>Amount (NIS)</Text>
      <View style={styles.amountInputWrap}>
        <Text style={styles.nisPrefix}>₪</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.textDisabled}
          keyboardType="numeric"
          returnKeyType="next"
          autoFocus
        />
      </View>

      {parseFloat(amount) > 0 && parseFloat(amount) > dailyBudget && (
        <View style={styles.budgetWarning}>
          <MaterialCommunityIcons name="alert-outline" size={16} color={colors.warningText} />
          <Text style={styles.budgetWarningText}>
            This exceeds your daily budget by {formatNIS(parseFloat(amount) - dailyBudget)}
          </Text>
        </View>
      )}

      <Text style={formStyles.label}>Description</Text>
      <TextInput
        style={formStyles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="What did you spend on?"
        returnKeyType="done"
      />

      <Text style={formStyles.label}>Category</Text>
      <CategorySelector selected={category} onSelect={setCategory} />

      <View style={styles.buttonWrap}>
        <ThemedButton
          title={saving ? 'Saving...' : 'Add Expense'}
          onPress={handleSave}
          variant="success"
          size="lg"
          loading={saving}
          disabled={saving}
          icon="add"
        />
      </View>

      {/* Success check overlay */}
      <Animated.View
        style={[
          styles.checkOverlay,
          {
            opacity: checkOpacity,
            transform: [{ scale: checkScale }],
          },
        ]}
        pointerEvents="none"
      >
        <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
      </Animated.View>

      <Text style={styles.dateText}>
        Today, {formatDate(new Date())}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  budgetCard: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  budgetCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  budgetCardText: {
    flex: 1,
  },
  budgetLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  budgetValue: {
    ...typography.heading3,
    color: colors.primary,
  },
  budgetWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  budgetWarningText: {
    ...typography.caption,
    color: colors.warningText,
    flex: 1,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  nisPrefix: {
    ...typography.heading3,
    color: colors.textTertiary,
    marginEnd: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
  buttonWrap: {
    marginTop: spacing.xxl,
  },
  checkOverlay: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    marginTop: -32,
  },
  dateText: {
    textAlign: 'center',
    color: colors.textTertiary,
    marginTop: spacing.md,
    ...typography.caption,
  },
});
