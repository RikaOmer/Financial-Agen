import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { colors, radius, spacing } from '@/src/core/theme';

type Preset = 'text' | 'circle' | 'card' | 'gauge';

interface Props {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  preset?: Preset;
  style?: ViewStyle;
}

const presets: Record<Preset, { width: DimensionValue; height: DimensionValue; borderRadius: number }> = {
  text: { width: '100%', height: 14, borderRadius: radius.sm },
  circle: { width: 48, height: 48, borderRadius: radius.circle },
  card: { width: '100%', height: 120, borderRadius: radius.xl },
  gauge: { width: 160, height: 160, borderRadius: radius.circle },
};

export function LoadingSkeleton({ width, height, borderRadius, preset, style }: Props) {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacityAnim]);

  const p = preset ? presets[preset] : undefined;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width ?? p?.width ?? '100%',
          height: height ?? p?.height ?? 14,
          borderRadius: borderRadius ?? p?.borderRadius ?? radius.sm,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
});
