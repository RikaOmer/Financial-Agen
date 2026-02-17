import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { colors, typography } from '@/src/core/theme';

interface Props {
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({
  progress,
  color = colors.primary,
  backgroundColor = colors.border,
  height = 8,
  showLabel = false,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: clamped,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, animValue]);

  const widthInterpolation = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrapper}>
      <View style={[styles.bg, { backgroundColor, height, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolation,
              backgroundColor: color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showLabel && height >= 16 && (
        <Text style={styles.label}>{Math.round(clamped * 100)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  bg: { overflow: 'hidden', flex: 1 },
  fill: { height: '100%' },
  label: {
    ...typography.caption,
    color: colors.textTertiary,
    marginStart: 8,
    minWidth: 36,
    textAlign: 'right',
  },
});
