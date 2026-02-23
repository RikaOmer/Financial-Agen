import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, radius, spacing } from '@/src/core/theme';

interface Props {
  isStrict: boolean;
}

export function StrictnessBadge({ isStrict }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isStrict ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isStrict, fadeAnim]);

  if (!isStrict) return null;

  return (
    <Animated.View style={[styles.badge, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <MaterialIcons
          name="warning-amber"
          size={20}
          color={colors.danger}
          style={styles.icon}
        />
        <Text style={styles.text}>STRICT MODE</Text>
      </View>
      <Text style={styles.hint}>
        This purchase is significantly above your daily budget — the Critic will evaluate more carefully.
      </Text>
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
