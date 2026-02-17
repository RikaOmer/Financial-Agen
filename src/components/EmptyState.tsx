import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/src/core/theme';
import { ThemedButton } from './ThemedButton';

interface Props {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionTitle, onAction }: Props) {
  return (
    <View style={styles.container}>
      <MaterialIcons name={icon} size={56} color={colors.textDisabled} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionTitle && onAction && (
        <ThemedButton
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.xl,
  },
});
