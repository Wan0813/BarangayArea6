import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../theme';
import Button from './Button';
import Input from './Input';

/**
 * Universal search bar (see docs/CONFIG.md).
 *
 * props:
 *   value, onChangeText       — text input
 *   onSubmit                  — submit search (page 1)
 *   filters                   — [{ key, label, value, options: [{label, value}] }]
 *   onFilterChange(key, value)
 *   onReset                   — clears text + filters and reloads page 1
 *   children                  — extra custom filter controls
 */
export default function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search…',
  filters = [],
  onFilterChange,
  onReset,
  children,
  style,
}) {
  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <Input
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={onSubmit}
            style={styles.input}
          />
        </View>
        <View style={styles.searchButton}>
          <Button title="Search" size="sm" onPress={onSubmit} />
        </View>
      </View>

      {filters.map((filter) => (
        <View key={filter.key} style={styles.filterBlock}>
          {filter.label ? <Text style={styles.filterLabel}>{filter.label}</Text> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip
              label="All"
              active={!filter.value}
              onPress={() => onFilterChange && onFilterChange(filter.key, '')}
            />
            {(filter.options || []).map((option) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              return (
                <Chip
                  key={String(optionValue)}
                  label={optionLabel}
                  active={filter.value === optionValue}
                  onPress={() => onFilterChange && onFilterChange(filter.key, optionValue)}
                />
              );
            })}
          </ScrollView>
        </View>
      ))}

      {children}

      <View style={styles.actionsRow}>
        <Button title="↺ Reset" size="sm" variant="outline" onPress={onReset} style={styles.resetButton} />
      </View>
    </View>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start' },
  inputWrapper: { flex: 1 },
  input: { marginBottom: 0 },
  searchButton: { marginLeft: spacing.sm, paddingTop: 1 },
  filterBlock: { marginTop: spacing.sm },
  filterLabel: { fontSize: fonts.sm, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.xs },
  chips: { gap: spacing.sm, paddingVertical: 2, paddingRight: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fonts.sm, color: colors.text },
  chipTextActive: { color: colors.white, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md },
  resetButton: { minWidth: 110 },
});
