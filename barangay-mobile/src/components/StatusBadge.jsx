import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fonts, radius, spacing, statusColors } from '../theme';

export default function StatusBadge({ status, style }) {
  const label = status || 'Unknown';
  const scheme = statusColors(status);
  return (
    <View style={[styles.badge, { backgroundColor: scheme.background }, style]}>
      <Text style={[styles.text, { color: scheme.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
  },
  text: { fontSize: fonts.sm, fontWeight: '700' },
});
