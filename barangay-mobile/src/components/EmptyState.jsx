import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../theme';
import Button from './Button';

export default function EmptyState({ title = 'Nothing here yet', message, actionTitle, onAction, style }) {
  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.icon}>📭</Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionTitle && onAction ? (
        <View style={styles.action}>
          <Button title={actionTitle} onPress={onAction} size="sm" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  icon: { fontSize: 36, marginBottom: spacing.sm },
  title: { fontSize: fonts.lg, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: {
    fontSize: fonts.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  action: { marginTop: spacing.lg, minWidth: 160 },
});
