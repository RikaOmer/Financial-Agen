import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { AnimatedNumber } from '@/src/components/AnimatedNumber';
import { colors, typography, spacing, radius, durations } from '@/src/core/theme';

interface Props {
  dailyBudget: number;
  spentToday?: number;
  monthlyTarget: number;
  spentThisMonth: number;
  totalCommitments?: number;
}

const GAUGE_SIZE = 180;
const GAUGE_BORDER = 10;

function getColor(ratio: number): string {
  if (ratio >= 0.7) return colors.success;
  if (ratio >= 0.4) return colors.warning;
  return colors.danger;
}

export function BudgetGauge({ dailyBudget, spentToday = 0, monthlyTarget, spentThisMonth, totalCommitments = 0 }: Props) {
  const remaining = Math.max(0, dailyBudget - spentToday);
  const monthlyRatio = monthlyTarget > 0 ? Math.max(0, Math.min(1, 1 - spentThisMonth / monthlyTarget)) : 1;
  const gaugeColor = getColor(monthlyRatio);
  const isDanger = monthlyRatio < 0.4;

  // Animated arc rotation (0 to monthlyRatio mapped to 0-360 degrees)
  const rotateAnim = useRef(new Animated.Value(0)).current;
  // Pulse animation for danger zone
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    rotateAnim.setValue(0);
    Animated.timing(rotateAnim, {
      toValue: monthlyRatio,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [monthlyRatio, rotateAnim]);

  useEffect(() => {
    if (isDanger) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isDanger, pulseAnim]);

  // Two half-circle technique for the fill arc
  // Right half rotates from 0 to 180deg, then left half from 0 to 180deg
  const rightRotation = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '180deg'],
    extrapolate: 'clamp',
  });
  const leftRotation = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '0deg', '180deg'],
    extrapolate: 'clamp',
  });

  // Segmented bar calculations
  const committedRatio = monthlyTarget > 0 ? Math.min(1, totalCommitments / monthlyTarget) : 0;
  const spentRatio = monthlyTarget > 0 ? Math.min(1 - committedRatio, spentThisMonth / monthlyTarget) : 0;
  const remainingRatio = Math.max(0, 1 - committedRatio - spentRatio);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      {/* Gauge */}
      <View style={styles.gaugeWrapper}>
        {/* Background track */}
        <View style={[styles.gaugeCircle, { borderColor: colors.borderLight }]} />

        {/* Right half fill */}
        <View style={styles.halfMaskRight}>
          <Animated.View
            style={[
              styles.halfFillRight,
              {
                borderColor: gaugeColor,
                transform: [{ rotate: rightRotation }],
              },
            ]}
          />
        </View>

        {/* Left half fill */}
        <View style={styles.halfMaskLeft}>
          <Animated.View
            style={[
              styles.halfFillLeft,
              {
                borderColor: gaugeColor,
                transform: [{ rotate: leftRotation }],
              },
            ]}
          />
        </View>

        {/* Center content */}
        <View style={styles.centerContent}>
          <AnimatedNumber
            value={remaining}
            prefix="₪"
            style={{ ...styles.centerAmount, color: gaugeColor }}
          />
          <Text style={styles.centerLabel}>left today</Text>
        </View>
      </View>

      {/* Segmented monthly bar */}
      <View style={styles.barContainer}>
        <View style={styles.segmentedBar}>
          {committedRatio > 0 && (
            <View style={[styles.segment, { flex: committedRatio, backgroundColor: colors.warning }]} />
          )}
          {spentRatio > 0 && (
            <View style={[styles.segment, { flex: spentRatio, backgroundColor: colors.danger }]} />
          )}
          {remainingRatio > 0 && (
            <View style={[styles.segment, { flex: remainingRatio, backgroundColor: colors.success }]} />
          )}
        </View>
        <View style={styles.barLabels}>
          <View style={styles.labelItem}>
            <View style={[styles.labelDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.labelText}>Committed</Text>
          </View>
          <View style={styles.labelItem}>
            <View style={[styles.labelDot, { backgroundColor: colors.danger }]} />
            <Text style={styles.labelText}>Spent</Text>
          </View>
          <View style={styles.labelItem}>
            <View style={[styles.labelDot, { backgroundColor: colors.success }]} />
            <Text style={styles.labelText}>Remaining</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const halfSize = GAUGE_SIZE / 2;

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.lg },
  gaugeWrapper: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  gaugeCircle: {
    position: 'absolute',
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    borderRadius: GAUGE_SIZE / 2,
    borderWidth: GAUGE_BORDER,
  },
  // Right half: clips to right side, rotates from top (12 o'clock) clockwise
  halfMaskRight: {
    position: 'absolute',
    width: halfSize,
    height: GAUGE_SIZE,
    right: 0,
    overflow: 'hidden',
  },
  halfFillRight: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    borderRadius: GAUGE_SIZE / 2,
    borderWidth: GAUGE_BORDER,
    borderColor: 'transparent',
    // pivot at the center of the full circle (left edge of this half)
    position: 'absolute',
    right: 0,
  },
  // Left half: clips to left side
  halfMaskLeft: {
    position: 'absolute',
    width: halfSize,
    height: GAUGE_SIZE,
    left: 0,
    overflow: 'hidden',
  },
  halfFillLeft: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    borderRadius: GAUGE_SIZE / 2,
    borderWidth: GAUGE_BORDER,
    borderColor: 'transparent',
    position: 'absolute',
    left: 0,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAmount: {
    ...typography.number,
  },
  centerLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xxs,
  },
  barContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  segmentedBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
  },
  segment: {
    height: '100%',
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.lg,
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});
