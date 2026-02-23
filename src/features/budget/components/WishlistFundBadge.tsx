import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AnimatedNumber } from '@/src/components/AnimatedNumber';
import { ProgressBar } from '@/src/components/ProgressBar';
import { colors, typography, spacing, radius, durations } from '@/src/core/theme';

interface Props {
  amount: number;
  goalName?: string;
  goalAmount?: number;
}

export function WishlistFundBadge({ amount, goalName, goalAmount }: Props) {
  const progress = goalAmount && goalAmount > 0 ? Math.min(1, amount / goalAmount) : 0;
  const isComplete = progress >= 1;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Don't show the badge if there's nothing to display
  if (amount <= 0 && !goalName) return null;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: durations.entrance,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: durations.entrance,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        isComplete && styles.containerComplete,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons
          name={isComplete ? 'party-popper' : 'piggy-bank-outline'}
          size={24}
          color={isComplete ? colors.success : colors.warningDark}
        />
        <Text style={[styles.label, isComplete && styles.labelComplete]}>
          Wishlist Fund
        </Text>
      </View>
      <AnimatedNumber
        value={amount}
        prefix="₪"
        style={{ ...styles.amount, ...(isComplete ? styles.amountComplete : undefined) }}
      />
      {goalName && goalAmount ? (
        <View style={styles.goalRow}>
          <View style={styles.progressWrapper}>
            <ProgressBar
              progress={progress}
              color={isComplete ? colors.success : colors.warning}
              backgroundColor={isComplete ? colors.successBorder : colors.warningBorder}
              height={6}
            />
            {/* Target marker */}
            {!isComplete && (
              <View style={[styles.targetMarker, { left: '100%' }]}>
                <View style={styles.markerTriangle} />
              </View>
            )}
          </View>
          <Text style={[styles.goalText, isComplete && styles.goalTextComplete]}>
            {Math.round(progress * 100)}% toward {goalName}
            {goalAmount ? ` (₪${goalAmount.toLocaleString()})` : ''}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  containerComplete: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.captionMedium,
    color: colors.warningText,
  },
  labelComplete: {
    color: colors.success,
  },
  amount: {
    ...typography.heading2,
    color: colors.warningDark,
    marginTop: spacing.xs,
  },
  amountComplete: {
    color: colors.success,
  },
  goalRow: { marginTop: spacing.sm },
  progressWrapper: {
    position: 'relative',
  },
  targetMarker: {
    position: 'absolute',
    top: -4,
    marginStart: -4,
  },
  markerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.warningDark,
  },
  goalText: {
    ...typography.caption,
    color: colors.warningText,
    marginTop: spacing.xs,
  },
  goalTextComplete: {
    color: colors.success,
  },
});
