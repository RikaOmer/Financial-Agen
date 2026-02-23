import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { InterviewQuestion, InterviewAnswer } from '@/src/types/behavioral';
import { ThemedButton } from '@/src/components/ThemedButton';
import { colors, typography, spacing, radius } from '@/src/core/theme';

interface Props {
  question: InterviewQuestion;
  onAnswer: (answer: InterviewAnswer) => void;
}

const CONSTRAINT_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  pet: 'pets',
  academic: 'school',
  hobby: 'sports-esports',
  wellness: 'spa',
  professional: 'work',
};

export function ConstraintStep({ question, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const constraint = question.constraint;
  const options = question.options ?? ['Yes, protect this', 'Reduce if possible', 'Not important'];

  const handleSelect = (option: string) => {
    setSelected(option);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onAnswer({
      questionId: question.id,
      type: question.type,
      value: selected,
      constraintType: constraint?.type,
    });
  };

  const iconName = constraint
    ? CONSTRAINT_ICONS[constraint.type] ?? 'category'
    : 'category';

  return (
    <View style={styles.container}>
      {constraint && (
        <View style={styles.constraintHeader}>
          <MaterialIcons name={iconName} size={28} color={colors.primary} />
          <Text style={styles.constraintLabel}>{constraint.label}</Text>
        </View>
      )}

      <Text style={styles.prompt}>{question.prompt}</Text>

      {constraint && constraint.evidence.length > 0 && (
        <View style={styles.evidenceBox}>
          <Text style={styles.evidenceTitle}>Evidence found:</Text>
          {constraint.evidence.map((item, index) => (
            <View key={index} style={styles.evidenceItem}>
              <MaterialIcons name="check-circle" size={16} color={colors.success} />
              <Text style={styles.evidenceText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.options}>
        {options.map((option) => (
          <ThemedButton
            key={option}
            title={option}
            onPress={() => handleSelect(option)}
            variant={selected === option ? 'primary' : 'outline'}
            size="lg"
            style={styles.optionButton}
          />
        ))}
      </View>

      {selected && (
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flex: 1,
  },
  constraintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  constraintLabel: {
    ...typography.heading3,
    color: colors.primary,
  },
  prompt: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  evidenceBox: {
    backgroundColor: colors.successBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.successBorder,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  evidenceTitle: {
    ...typography.captionMedium,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  evidenceText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  options: {
    gap: spacing.md,
  },
  optionButton: {
    width: '100%',
  },
  confirmRow: {
    marginTop: spacing.xxl,
    alignItems: 'flex-end',
  },
});
