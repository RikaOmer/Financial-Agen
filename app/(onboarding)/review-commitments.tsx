import React, { useEffect, useRef } from 'react';
import { View, Text, FlatList, Animated, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors, typography, spacing, shadows, durations } from '@/src/core/theme';
import { ThemedButton } from '@/src/components/ThemedButton';
import { AnimatedNumber } from '@/src/components/AnimatedNumber';
import { EmptyState } from '@/src/components/EmptyState';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import { CommitmentCard } from '@/src/features/onboarding/components/CommitmentCard';
import { insertCommitment } from '@/src/core/db/queries/commitments';
import { formatNIS } from '@/src/utils/currency';

export default function ReviewCommitmentsScreen() {
  const db = useSQLiteContext();
  const { detectedCommitments } = useOnboardingStore();
  const toggleCommitment = useOnboardingStore((s) => s.toggleCommitment);

  const selectedTotal = detectedCommitments
    .filter((c) => c.selected)
    .reduce((sum, c) => sum + c.amount, 0);

  // Staggered entrance animations for list items
  const itemAnims = useRef(
    detectedCommitments.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (detectedCommitments.length > 0) {
      Animated.stagger(
        80,
        itemAnims.slice(0, detectedCommitments.length).map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: durations.entrance,
            useNativeDriver: true,
          }),
        ),
      ).start();
    }
  }, [detectedCommitments.length]);

  const handleConfirm = async () => {
    const selected = detectedCommitments.filter((c) => c.selected);
    for (const c of selected) {
      await insertCommitment(db, {
        name: c.name,
        amount: c.amount,
        type: c.type,
        total_installments: c.total_installments,
        remaining_installments: c.remaining_installments,
        end_date: c.end_date,
        category: c.category,
      });
    }
    router.push('/(onboarding)/set-target');
  };

  const renderItem = ({ item, index }: { item: typeof detectedCommitments[0]; index: number }) => {
    const anim = itemAnims[index];
    if (!anim) return <CommitmentCard commitment={item} onToggle={() => toggleCommitment(index)} />;

    return (
      <Animated.View
        style={{
          opacity: anim,
          transform: [{
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          }],
        }}
      >
        <CommitmentCard commitment={item} onToggle={() => toggleCommitment(index)} />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detected Commitments</Text>
      <Text style={styles.hint}>
        Toggle off any items that are incorrect. These recurring charges will be deducted from your
        monthly budget.
      </Text>

      <FlatList
        data={detectedCommitments}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="playlist-add-check"
            title="No Commitments Detected"
            description="No subscriptions or installments were found. You can add them later from the Commitments tab."
          />
        }
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total monthly commitments</Text>
        <AnimatedNumber
          value={selectedTotal}
          prefix="₪"
          style={styles.totalAmount}
        />
        <ThemedButton
          title="Confirm & Set Target"
          onPress={handleConfirm}
          variant="primary"
          size="lg"
          icon="arrow-forward"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    padding: spacing.xl,
    paddingBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.xl,
  },
  footer: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    ...shadows.lg,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  totalAmount: {
    ...typography.heading2,
    color: colors.primary,
    marginVertical: spacing.sm,
  },
});
