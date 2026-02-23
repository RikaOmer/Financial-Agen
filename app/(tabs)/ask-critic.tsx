import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAICritic } from '@/src/features/agent/hooks/useAICritic';
import { CriticVerdictCard } from '@/src/features/agent/components/CriticVerdict';
import { StrictnessBadge } from '@/src/features/agent/components/StrictnessBadge';
import { useBudgetStore } from '@/src/stores/budget-store';
import { insertTransaction } from '@/src/core/db/queries/transactions';
import { CategorySelector } from '@/src/components/CategorySelector';
import { ThemedCard } from '@/src/components/ThemedCard';
import { ThemedButton } from '@/src/components/ThemedButton';
import { AnimatedNumber } from '@/src/components/AnimatedNumber';
import { useToast } from '@/src/components/Toast';
import { formatNIS } from '@/src/utils/currency';
import { formStyles } from '@/src/styles/form-styles';
import { STRICT_MODE_THRESHOLD } from '@/src/core/constants/app-constants';
import { colors, typography, spacing, radius, durations } from '@/src/core/theme';

function ThinkingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

    const a1 = animateDot(dot1, 0);
    const a2 = animateDot(dot2, 200);
    const a3 = animateDot(dot3, 400);
    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={thinkingStyles.container}>
      <MaterialCommunityIcons name="robot-excited-outline" size={48} color={colors.purple} />
      <View style={thinkingStyles.dotsRow}>
        <Animated.View style={[thinkingStyles.dot, { opacity: dot1 }]} />
        <Animated.View style={[thinkingStyles.dot, { opacity: dot2 }]} />
        <Animated.View style={[thinkingStyles.dot, { opacity: dot3 }]} />
      </View>
      <Text style={thinkingStyles.text}>Analyzing your purchase...</Text>
      <Text style={thinkingStyles.subtext}>Checking budget, history, and alternatives</Text>
    </View>
  );
}

const thinkingStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.purple,
  },
  text: {
    ...typography.bodyMedium,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  subtext: {
    ...typography.caption,
    color: colors.textDisabled,
    marginTop: spacing.xs,
  },
});

export default function AskCriticScreen() {
  const db = useSQLiteContext();
  const { showToast } = useToast();
  const { verdict, status, error, evaluate, reset } = useAICritic();
  const { snapshot, refreshBudget } = useBudgetStore();

  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('food_dining');

  const priceNum = parseFloat(price) || 0;
  const isStrict = priceNum > snapshot.dailyBudget * STRICT_MODE_THRESHOLD;

  const handleEvaluate = () => {
    if (!itemName.trim() || priceNum <= 0) {
      showToast('Please enter item name and price.', 'error');
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
    showToast(`${formatNIS(priceNum)} recorded.`, 'success');
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
    <ScrollView style={formStyles.container} contentContainerStyle={formStyles.content} keyboardShouldPersistTaps="handled">
      {/* Budget hint card */}
      <ThemedCard variant="primary" style={styles.budgetCard}>
        <View style={styles.budgetCardInner}>
          <MaterialCommunityIcons name="gauge" size={24} color={colors.primary} />
          <View style={styles.budgetCardText}>
            <Text style={styles.budgetLabel}>Daily Budget</Text>
            <AnimatedNumber value={snapshot.dailyBudget} prefix="₪" style={styles.budgetValue} />
          </View>
        </View>
      </ThemedCard>

      {!verdict && status !== 'loading' && (
        <>
          <Text style={formStyles.label}>What do you want to buy?</Text>
          <TextInput
            style={formStyles.input}
            value={itemName}
            onChangeText={setItemName}
            placeholder="e.g. Burger, Movie ticket"
            returnKeyType="next"
          />

          <Text style={formStyles.label}>Price (NIS)</Text>
          <TextInput
            style={formStyles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="numeric"
            returnKeyType="done"
          />

          <Text style={formStyles.label}>Category</Text>
          <CategorySelector selected={category} onSelect={setCategory} />

          <StrictnessBadge isStrict={isStrict} />

          <ThemedButton
            title="Ask the Critic"
            onPress={handleEvaluate}
            variant="primary"
            size="lg"
            icon="smart-toy"
            style={styles.evaluateBtn}
          />
        </>
      )}

      {status === 'loading' && <ThinkingIndicator />}

      {error && (
        <ThemedCard variant="danger" style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <ThemedButton
            title="Retry"
            onPress={handleEvaluate}
            variant="danger"
            size="sm"
            icon="refresh"
            style={styles.retryBtn}
          />
        </ThemedCard>
      )}

      {verdict && (
        <>
          <CriticVerdictCard verdict={verdict} />
          <View style={styles.actionRow}>
            <ThemedButton
              title="Buy Anyway"
              onPress={handleBuyAnyway}
              variant="danger"
              size="lg"
              icon="shopping-cart"
              style={styles.actionBtn}
            />
            <ThemedButton
              title="Skip It"
              onPress={handleSkip}
              variant="success"
              size="lg"
              icon="check"
              style={styles.actionBtn}
            />
          </View>
        </>
      )}
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
  evaluateBtn: {
    marginTop: spacing.xl,
  },
  errorCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.dangerText,
  },
  retryBtn: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionBtn: {
    flex: 1,
  },
});
