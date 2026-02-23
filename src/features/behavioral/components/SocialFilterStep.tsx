import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { InterviewQuestion, InterviewAnswer } from '@/src/types/behavioral';
import { ThemedButton } from '@/src/components/ThemedButton';
import { colors, typography, spacing, radius } from '@/src/core/theme';

interface Props {
  question: InterviewQuestion;
  onAnswer: (answer: InterviewAnswer) => void;
}

export function SocialFilterStep({ question, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const options = question.options ?? ['Often social', 'Sometimes social', 'Usually alone'];

  const handleSelect = (option: string) => {
    setSelected(option);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onAnswer({
      questionId: question.id,
      type: question.type,
      value: selected,
      category: question.category,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>{question.prompt}</Text>

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
  prompt: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
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
