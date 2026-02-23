import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { InterviewQuestion, InterviewAnswer } from '@/src/types/behavioral';
import { ThemedButton } from '@/src/components/ThemedButton';
import { colors, typography, spacing, radius, shadows } from '@/src/core/theme';

interface Props {
  question: InterviewQuestion;
  onAnswer: (answer: InterviewAnswer) => void;
}

const SCALE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function EmotionalRoiStep({ question, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selected === null) return;
    onAnswer({
      questionId: question.id,
      type: question.type,
      value: selected,
      category: question.category,
    });
  };

  return (
    <View style={styles.container}>
      {question.category && (
        <Text style={styles.category}>{question.category}</Text>
      )}

      <Text style={styles.prompt}>{question.prompt}</Text>

      <View style={styles.scaleContainer}>
        <View style={styles.labelsRow}>
          <Text style={styles.scaleLabel}>Not at all</Text>
          <Text style={styles.scaleLabel}>Extremely</Text>
        </View>
        <View style={styles.numbersRow}>
          {SCALE_VALUES.map((num) => {
            const isSelected = selected === num;
            return (
              <Pressable
                key={num}
                onPress={() => setSelected(num)}
                style={[
                  styles.numberCircle,
                  isSelected && styles.numberCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.numberText,
                    isSelected && styles.numberTextSelected,
                  ]}
                >
                  {num}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {selected !== null && (
        <View style={styles.confirmRow}>
          <ThemedButton
            title="Continue"
            onPress={handleConfirm}
            variant="primary"
            size="md"
            icon="arrow-forward"
          />
        </View>
      )}
    </View>
  );
}

const CIRCLE_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flex: 1,
  },
  category: {
    ...typography.overline,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  prompt: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.xxl,
  },
  scaleContainer: {
    gap: spacing.sm,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxs,
  },
  scaleLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numberCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  numberCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.md,
  },
  numberText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  numberTextSelected: {
    color: colors.textInverse,
  },
  confirmRow: {
    marginTop: spacing.xxl,
    alignItems: 'flex-end',
  },
});
