import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../theme';

/** Thumbnail built from config.fileBaseUrl + imageUrl (already resolved). */
export default function Thumbnail({ url, size = 64, style, label }) {
  if (!url) return null;
  return (
    <View style={[styles.wrapper, style]}>
      <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: radius.sm }} resizeMode="cover" />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  label: { fontSize: fonts.sm, color: colors.textMuted, marginTop: spacing.xs },
});
