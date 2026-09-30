import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '../theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  required = false,
  multiline = false,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize = 'sentences',
  editable = true,
  style,
  inputStyle,
  children,
  ...rest
}) {
  // Every secureTextEntry field is a password: give it a clickable eye
  // button that toggles visibility. Non-password fields render as before.
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry === true;

  const textField = (
    <TextInput
      value={value === undefined || value === null ? '' : String(value)}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      multiline={multiline}
      secureTextEntry={isPassword && !visible}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      editable={editable}
      style={[
        styles.input,
        isPassword && styles.passwordInput,
        multiline && styles.multiline,
        !editable && styles.readOnly,
        error ? styles.inputError : null,
        inputStyle,
      ]}
      {...rest}
    />
  );

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      {children ? (
        children
      ) : isPassword ? (
        <View style={[styles.input, styles.passwordRow, !editable && styles.readOnly, error ? styles.inputError : null]}>
          <View style={styles.passwordField}>{textField}</View>
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            accessibilityState={{ selected: visible }}
            hitSlop={8}
            style={styles.eyeButton}
          >
            <Feather name={visible ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : (
        textField
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { fontSize: fonts.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  required: { color: colors.danger },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.md,
    color: colors.text,
    minHeight: 44,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.md },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    paddingRight: spacing.xs,
  },
  passwordField: { flex: 1 },
  passwordInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
    minHeight: 0,
  },
  eyeButton: { padding: spacing.xs },
  readOnly: { backgroundColor: colors.neutralSoft, color: colors.textMuted },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: fonts.sm, marginTop: spacing.xs },
  hint: { color: colors.textMuted, fontSize: fonts.sm, marginTop: spacing.xs },
});
