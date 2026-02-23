import { StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '@/src/core/theme';

export const formStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  budgetHint: {
    ...typography.bodySemiBold,
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: colors.primaryBg,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
