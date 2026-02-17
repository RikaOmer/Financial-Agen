import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing, durations } from '@/src/core/theme';

type CardVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

interface Props {
  children: React.ReactNode;
  variant?: CardVariant;
  animated?: boolean;
  style?: ViewStyle;
}

const borderColors: Record<CardVariant, string | undefined> = {
  default: undefined,
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
};

export function ThemedCard({ children, variant = 'default', animated = false, style }: Props) {
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animated ? 12 : 0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: durations.entrance,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: durations.entrance,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, fadeAnim, slideAnim]);

  const borderColor = borderColors[variant];

  return (
    <Animated.View
      style={[
        styles.card,
        borderColor ? { borderLeftWidth: 4, borderLeftColor: borderColor } : undefined,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
});
