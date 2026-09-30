import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../theme';
import Button from './Button';

export default function ErrorBanner({ message, onRetry, onDismiss, style }) {
  if (!message) return null;
  return (
    <View style={[styles.banner, style]} accessibilityRole="alert">
      <View style={styles.row}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.text}>{String(message)}</Text>
      </View>
      {onRetry || onDismiss ? (
        <View style={styles.actions}>
          {onRetry ? <Button title="Retry" size="sm" variant="outline" onPress={onRetry} /> : null}
          {onDismiss ? (
            <Button title="Dismiss" size="sm" variant="secondary" onPress={onDismiss} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { marginRight: spacing.sm },
  text: { flex: 1, color: colors.danger, fontSize: fonts.md },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
