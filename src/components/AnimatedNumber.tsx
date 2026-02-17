import React, { useEffect, useRef, useState } from 'react';
import { Animated, TextStyle } from 'react-native';
import { colors, typography, durations } from '@/src/core/theme';

interface Props {
  value: number;
  prefix?: string;
  style?: TextStyle;
}

export function AnimatedNumber({ value, prefix = '', style }: Props) {
  const animValue = useRef(new Animated.Value(value)).current;
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const listener = animValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    Animated.timing(animValue, {
      toValue: value,
      duration: durations.slow,
      useNativeDriver: false,
    }).start();

    return () => {
      animValue.removeListener(listener);
    };
  }, [value, animValue]);

  return (
    <Animated.Text style={[defaultStyle, style]}>
      {prefix}{displayValue.toLocaleString()}
    </Animated.Text>
  );
}

const defaultStyle: TextStyle = {
  ...typography.number,
  color: colors.textPrimary,
};
