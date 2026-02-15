import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  isStrict: boolean;
}

export function StrictnessBadge({ isStrict }: Props) {
  if (!isStrict) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>STRICT MODE</Text>
      <Text style={styles.hint}>Price exceeds 1.5x daily budget</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    alignItems: 'center',
  },
  text: { color: '#dc2626', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  hint: { color: '#b91c1c', fontSize: 12, marginTop: 2 },
});
