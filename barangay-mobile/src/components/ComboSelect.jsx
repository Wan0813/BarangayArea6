import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../theme';
import Input from './Input';

/**
 * Combo control: pick one of the suggested values, or type a custom one.
 *
 * props:
 *   label, value, onChange(text)
 *   suggestions  — string[]
 *   placeholder, required, hint
 *   allowCustom  — default true
 */
export default function ComboSelect({
  label,
  value,
  onChange,
  suggestions = [],
  placeholder = 'Choose or type…',
  required = false,
  allowCustom = true,
  hint,
  style,
}) {
  const [custom, setCustom] = useState(false);
  const isCustomValue = Boolean(value) && !suggestions.includes(value);

  const select = (item) => {
    setCustom(false);
    onChange(item === value ? '' : item);
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {suggestions.map((item) => {
          const active = !custom && value === item;
          return (
            <Pressable
              key={item}
              onPress={() => select(item)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          );
        })}
        {allowCustom ? (
          <Pressable
            onPress={() => {
              setCustom(true);
              onChange('');
            }}
            style={[styles.chip, styles.customChip, custom && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: custom }}
          >
            <Text style={[styles.chipText, custom && styles.chipTextActive]}>✎ Custom</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {custom || isCustomValue ? (
        <Input
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          style={styles.customInput}
        />
      ) : null}

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { fontSize: fonts.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  required: { color: colors.danger },
  chips: { gap: spacing.sm, paddingVertical: 2, paddingRight: spacing.md, flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fonts.sm, color: colors.text },
  chipTextActive: { color: colors.white, fontWeight: '700' },
  customChip: { borderStyle: 'dashed' },
  customInput: { marginTop: spacing.sm, marginBottom: 0 },
  hint: { color: colors.textMuted, fontSize: fonts.sm, marginTop: spacing.xs },
});
