import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { colors, fonts, radius, spacing } from '../theme';
import Button from './Button';

export default function ImagePickerField({
  label = 'Photo',
  hint,
  required = false,
  value,
  onChange,
  aspect = [4, 3],
  style,
}) {
  const pick = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        // Fall back to the camera, whose permission prompt is separate.
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) return;
        const shot = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: true,
          aspect,
          base64: true,
        });
        if (!shot.canceled && shot.assets && shot.assets[0]) onChange(shot.assets[0]);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) onChange(result.assets[0]);
    } catch (e) {
      // Keep the previous value on failure.
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) onChange(result.assets[0]);
    } catch (e) {
      // ignore
    }
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      {value && value.uri ? (
        <View style={styles.previewRow}>
          <Image source={{ uri: value.uri }} style={styles.preview} resizeMode="cover" />
          <View style={styles.previewActions}>
            <Button title="Replace" size="sm" variant="secondary" onPress={pick} />
            <View style={styles.spacer} />
            <Button title="Remove" size="sm" variant="outline" onPress={() => onChange(null)} />
          </View>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}

      <View style={styles.buttons}>
        <View style={styles.flex}>
          <Button title="Choose from gallery" size="sm" variant="secondary" onPress={pick} />
        </View>
        <View style={styles.spacer} />
        <View style={styles.flex}>
          <Button title="Take photo" size="sm" variant="secondary" onPress={takePhoto} />
        </View>
      </View>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { fontSize: fonts.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  required: { color: colors.danger },
  placeholder: {
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { color: colors.textMuted, fontSize: fonts.sm },
  previewRow: { flexDirection: 'row', alignItems: 'center' },
  preview: {
    width: 140,
    height: 105,
    borderRadius: radius.md,
    backgroundColor: colors.neutralSoft,
  },
  previewActions: { flex: 1, paddingLeft: spacing.md, gap: spacing.sm },
  buttons: { flexDirection: 'row', marginTop: spacing.sm, alignItems: 'center' },
  flex: { flex: 1 },
  spacer: { width: spacing.sm },
  hint: { color: colors.textMuted, fontSize: fonts.sm, marginTop: spacing.xs },
});
