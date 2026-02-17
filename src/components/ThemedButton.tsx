import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, radius, spacing, shadows } from '@/src/core/theme';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconFamily?: 'MaterialIcons';
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string; ripple: string }> = {
  primary: { bg: colors.primary, text: colors.textInverse, ripple: colors.primaryDark },
  secondary: { bg: colors.borderLight, text: colors.textSecondary, ripple: colors.border },
  success: { bg: colors.success, text: colors.textInverse, ripple: colors.successLight },
  danger: { bg: colors.danger, text: colors.textInverse, ripple: colors.dangerText },
  ghost: { bg: 'transparent', text: colors.primary, ripple: colors.primaryBg },
  outline: { bg: 'transparent', text: colors.primary, border: colors.primaryBorder, ripple: colors.primaryBg },
};

const sizeStyles: Record<ButtonSize, { height: number; px: number; typo: TextStyle }> = {
  sm: { height: 36, px: spacing.md, typo: typography.buttonSmall },
  md: { height: 44, px: spacing.lg, typo: typography.buttonDefault },
  lg: { height: 52, px: spacing.xl, typo: typography.buttonLarge },
};

export function ThemedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        android_ripple={Platform.OS === 'android' ? { color: vs.ripple } : undefined}
        style={[
          styles.base,
          {
            height: ss.height,
            paddingHorizontal: ss.px,
            backgroundColor: vs.bg,
          },
          vs.border ? { borderWidth: 1.5, borderColor: vs.border } : undefined,
          isDisabled ? styles.disabled : undefined,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={vs.text} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && (
              <MaterialIcons
                name={icon}
                size={(ss.typo.fontSize ?? 16) + 2}
                color={vs.text}
                style={styles.icon}
              />
            )}
            <Text style={[ss.typo, { color: vs.text }]}>{title}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginEnd: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});
