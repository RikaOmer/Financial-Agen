import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, radius, spacing } from '@/src/core/theme';

interface Props {
  isStrict: boolean;
}

export function StrictnessBadge({ isStrict }: Props) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const borderOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isStrict) return;

    // Shake entrance: 0 -> 5 -> -5 -> 3 -> -3 -> 0
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 5, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 3, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -3, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    // Pulsing border opacity: 0.5 <-> 1.0
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(borderOpacity, {
          toValue: 0.5,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(borderOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [isStrict, shakeAnim, borderOpacity]);

  if (!isStrict) return null;

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          transform: [{ translateX: shakeAnim }],
          opacity: borderOpacity,
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialIcons
          name="warning-amber"
          size={20}
          color={colors.danger}
          style={styles.icon}
        />
        <Text style={styles.text}>STRICT MODE</Text>
      </View>
      <Text style={styles.hint}>Price exceeds 1.5x daily budget</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginVertical: spacing.sm,
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginEnd: spacing.xs,
  },
  text: {
    ...typography.overline,
    color: colors.danger,
  },
  hint: {
    ...typography.caption,
    color: colors.dangerText,
    marginTop: spacing.xxs,
  },
});
