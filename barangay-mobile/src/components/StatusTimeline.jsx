import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../theme';

const COMPLAINT_STEPS = ['Pending', 'Ongoing', 'Resolved'];

/**
 * Vertical status timeline.
 *
 * props:
 *   status   — current status string
 *   steps    — optional custom step labels (defaults to complaint flow)
 *   rejected — status value that marks a terminal "negative" state
 *   timestamps — optional { [step]: 'date string' }
 */
export default function StatusTimeline({ status, steps = COMPLAINT_STEPS, rejected = 'Rejected', timestamps = {} }) {
  const isRejected = status === rejected;
  const activeIndex = steps.indexOf(status);

  return (
    <View style={styles.wrapper}>
      {steps.map((step, index) => {
        const done = !isRejected && activeIndex >= 0 && index < activeIndex;
        const current = !isRejected && index === activeIndex;
        const reached = done || current;
        const last = index === steps.length - 1;

        const dotColor = reached ? (current ? colors.primary : colors.success) : colors.border;
        const lineColor = done ? colors.success : colors.border;

        return (
          <View key={step} style={styles.row}>
            <View style={styles.markerColumn}>
              <View style={[styles.dot, { backgroundColor: dotColor, borderColor: dotColor }]}>
                {current ? <View style={styles.dotInner} /> : null}
              </View>
              {!last ? <View style={[styles.line, { backgroundColor: lineColor }]} /> : null}
            </View>
            <View style={[styles.content, last && styles.contentLast]}>
              <Text style={[styles.label, reached && styles.labelReached]}>{step}</Text>
              {timestamps[step] ? <Text style={styles.time}>{timestamps[step]}</Text> : null}
              {current ? <Text style={styles.currentTag}>Current status</Text> : null}
            </View>
          </View>
        );
      })}

      {isRejected ? (
        <View style={styles.row}>
          <View style={styles.markerColumn}>
            <View style={[styles.dot, { backgroundColor: colors.danger, borderColor: colors.danger }]} />
          </View>
          <View style={[styles.content, styles.contentLast]}>
            <Text style={[styles.label, { color: colors.danger }]}>Rejected</Text>
            <Text style={styles.currentTag}>Current status</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: spacing.sm },
  row: { flexDirection: 'row' },
  markerColumn: { width: 24, alignItems: 'center' },
  dot: {
    width: 14,
    height: 14,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  dotInner: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.white },
  line: { width: 2, flex: 1, minHeight: 26, marginVertical: 2 },
  content: { flex: 1, paddingLeft: spacing.sm, paddingBottom: spacing.lg },
  contentLast: { paddingBottom: spacing.sm },
  label: { fontSize: fonts.md, color: colors.textMuted, fontWeight: '600' },
  labelReached: { color: colors.text },
  time: { fontSize: fonts.sm, color: colors.textMuted, marginTop: 2 },
  currentTag: { fontSize: fonts.sm, color: colors.primary, marginTop: 2, fontWeight: '600' },
});
