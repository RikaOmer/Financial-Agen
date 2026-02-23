import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from '@/src/components/ProgressBar';
import { colors, typography, spacing } from '@/src/core/theme';

interface Props {
  current: number;
  total: number;
}

export function InterviewProgress({ current, total }: Props) {
  const progress = total > 0 ? current / total : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.stepText}>
        Step {Math.min(current + 1, total)} of {total}
      </Text>
      <ProgressBar progress={progress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  stepText: {
    ...typography.captionMedium,
    color: colors.textTertiary,
  },
});
