import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../theme';

export default function Loading({ text = 'Loading…', inline = false, style }) {
  if (inline) {
    return (
      <View style={[styles.inline, style]}>
        <ActivityIndicator size="small" color={colors.primary} />
        {text ? <Text style={styles.inlineText}>{text}</Text> : null}
      </View>
    );
  }
  return (
    <View style={[styles.wrapper, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  text: { marginTop: spacing.md, color: colors.textMuted, fontSize: fonts.md },
  inline: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  inlineText: { marginLeft: spacing.sm, color: colors.textMuted, fontSize: fonts.sm },
});
