import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

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
      ) : (
        <TextInput
          value={value === undefined || value === null ? '' : String(value)}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          style={[
            styles.input,
            multiline && styles.multiline,
            !editable && styles.readOnly,
            error ? styles.inputError : null,
            inputStyle,
          ]}
          {...rest}
        />
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
  readOnly: { backgroundColor: colors.neutralSoft, color: colors.textMuted },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: fonts.sm, marginTop: spacing.xs },
  hint: { color: colors.textMuted, fontSize: fonts.sm, marginTop: spacing.xs },
});
