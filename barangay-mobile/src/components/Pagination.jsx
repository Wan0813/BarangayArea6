import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../theme';
import Button from './Button';

export default function Pagination({ page = 1, totalPages = 1, hasNext, hasPrevious, totalItems, onPageChange, style }) {
  const total = Number(totalPages) || 1;
  const current = Number(page) || 1;
  const canPrev = hasPrevious !== undefined ? hasPrevious : current > 1;
  const canNext = hasNext !== undefined ? hasNext : current < total;

  return (
    <View style={[styles.wrapper, style]}>
      <Button
        title="‹ Prev"
        size="sm"
        variant="secondary"
        disabled={!canPrev}
        onPress={() => onPageChange(current - 1)}
      />
      <View style={styles.center}>
        <Text style={styles.text}>
          Page {current} of {total}
        </Text>
        {totalItems !== undefined && totalItems !== null ? (
          <Text style={styles.sub}>{totalItems} item(s)</Text>
        ) : null}
      </View>
      <Button
        title="Next ›"
        size="sm"
        variant="secondary"
        disabled={!canNext}
        onPress={() => onPageChange(current + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  center: { alignItems: 'center', flex: 1 },
  text: { color: colors.text, fontSize: fonts.sm, fontWeight: '600' },
  sub: { color: colors.textMuted, fontSize: fonts.sm },
});
