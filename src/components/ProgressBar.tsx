import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  color = '#2563eb',
  backgroundColor = '#e2e8f0',
  height = 8,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.bg, { backgroundColor, height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%`, backgroundColor: color, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { overflow: 'hidden', width: '100%' },
  fill: { height: '100%' },
});
