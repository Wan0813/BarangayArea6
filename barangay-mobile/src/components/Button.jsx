import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../theme';

const VARIANTS = {
  primary: { bg: colors.primary, border: colors.primary, text: colors.white },
  danger: { bg: colors.danger, border: colors.danger, text: colors.white },
  success: { bg: colors.success, border: colors.success, text: colors.white },
  secondary: { bg: colors.neutralSoft, border: colors.border, text: colors.text },
  outline: { bg: colors.surface, border: colors.primary, text: colors.primary },
  ghost: { bg: 'transparent', border: 'transparent', text: colors.primary },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  size = 'md',
  style,
  textStyle,
}) {
  const scheme = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        size === 'lg' && styles.lg,
        {
          backgroundColor: scheme.bg,
          borderColor: scheme.border,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator size="small" color={scheme.text} style={styles.spinner} /> : null}
        <Text style={[styles.text, { color: scheme.text }, textStyle]} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 36 },
  lg: { paddingVertical: spacing.lg, minHeight: 54 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  spinner: { marginRight: spacing.sm },
  text: { fontSize: fonts.md, fontWeight: '600', textAlign: 'center' },
});
