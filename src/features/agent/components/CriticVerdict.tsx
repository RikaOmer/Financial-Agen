import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, radius, spacing, shadows } from '@/src/core/theme';
import type { CriticVerdict as VerdictType } from '@/src/types/agent';

interface Props {
  verdict: VerdictType;
}

const RECOMMENDATION_CONFIG = {
  approve: {
    color: colors.success,
    bg: colors.successBg,
    label: 'Go For It',
    icon: 'check-circle' as const,
  },
  consider: {
    color: colors.warning,
    bg: colors.warningBg,
    label: 'Think Twice',
    icon: 'alert-circle' as const,
  },
  reject: {
    color: colors.danger,
    bg: colors.dangerBg,
    label: 'Skip It',
    icon: 'close-circle' as const,
  },
};

const ASSESSMENT_LABELS: Record<string, string> = {
  great_deal: 'Great Deal',
  fair: 'Fair Price',
  overpriced: 'Overpriced',
  luxury: 'Luxury',
};

export function CriticVerdictCard({ verdict }: Props) {
  const config = RECOMMENDATION_CONFIG[verdict.recommendation];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const confidenceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(confidenceAnim, {
      toValue: verdict.confidence,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
      delay: 300,
    }).start();
  }, [fadeAnim, slideAnim, confidenceAnim, verdict.confidence]);

  const confidenceWidth = confidenceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: config.bg, borderColor: config.color },
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons
          name={config.icon}
          size={28}
          color={config.color}
          style={styles.icon}
        />
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
        <Text style={styles.assessment}>
          {ASSESSMENT_LABELS[verdict.valueAssessment] ?? verdict.valueAssessment}
        </Text>
      </View>

      <Text style={styles.reasoning}>{verdict.reasoning}</Text>

      {verdict.alternativeSuggestion && (
        <View style={styles.altContainer}>
          <View style={styles.altHeader}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={16}
              color={colors.textTertiary}
              style={styles.altIcon}
            />
            <Text style={styles.altLabel}>Alternative:</Text>
          </View>
          <Text style={styles.altText}>{verdict.alternativeSuggestion}</Text>
        </View>
      )}

      <View style={styles.confidenceRow}>
        <Text style={styles.confidenceLabel}>Confidence:</Text>
        <View style={styles.confidenceBar}>
          <Animated.View
            style={[
              styles.confidenceFill,
              { width: confidenceWidth, backgroundColor: config.color },
            ]}
          />
        </View>
        <Text style={styles.confidenceValue}>{Math.round(verdict.confidence * 100)}%</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 2,
    marginVertical: spacing.md,
    ...shadows.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  icon: { marginEnd: spacing.sm },
  label: { ...typography.heading3, flex: 1 },
  assessment: {
    ...typography.captionMedium,
    color: colors.textTertiary,
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  reasoning: { ...typography.body, color: colors.textSecondary },
  altContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceOverlay,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  altHeader: { flexDirection: 'row', alignItems: 'center' },
  altIcon: { marginEnd: spacing.xs },
  altLabel: { ...typography.captionMedium, color: colors.textTertiary },
  altText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  confidenceLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginEnd: spacing.sm,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.subtleBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: { height: '100%', borderRadius: 3 },
  confidenceValue: {
    ...typography.caption,
    color: colors.textTertiary,
    marginStart: spacing.sm,
    width: 35,
  },
});
