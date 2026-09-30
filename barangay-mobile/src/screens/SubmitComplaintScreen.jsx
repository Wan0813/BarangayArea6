import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorBanner from '../components/ErrorBanner';
import ImagePickerField from '../components/ImagePickerField';
import ComboSelect from '../components/ComboSelect';
import { complaints } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing } from '../theme';

const SUGGESTED_TYPES = ['Place Complaint', 'Person Complaint', 'Noise/Cleanliness', 'Other'];

export default function SubmitComplaintScreen({ navigation }) {
  const { user } = useAuth();
  const [type, setType] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(user?.address || '');
  const [image, setImage] = useState(null);
  const [suggestions, setSuggestions] = useState(SUGGESTED_TYPES);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await complaints.types();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data && data.items ? data.items : [];
        const normalized = list
          .map((entry) => (typeof entry === 'string' ? entry : entry && (entry.type || entry.name)))
          .filter(Boolean);
        if (normalized.length > 0) {
          const merged = [...SUGGESTED_TYPES];
          normalized.forEach((item) => {
            if (!merged.includes(item)) merged.push(item);
          });
          setSuggestions(merged);
        }
      } catch (e) {
        // Keep the built-in suggestions.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async () => {
    setError('');
    const errors = {};
    if (!type.trim()) errors.type = 'Select or type what kind of complaint this is.';
    if (!subject.trim()) errors.subject = 'A short subject is required.';
    if (!description.trim()) errors.description = 'Describe the complaint.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Please complete the required fields.');
      return;
    }

    setBusy(true);
    try {
      await complaints.create(
        {
          type: type.trim(),
          subject: subject.trim(),
          description: description.trim(),
          location: location.trim(),
        },
        image
      );
      Alert.alert('Complaint submitted', 'Barangay staff will review your complaint and respond.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard>
      <Text style={styles.title}>File a complaint</Text>
      <Text style={styles.subtitle}>
        Your complaint is filed under {user?.fullName || user?.username || 'your account'} and is only visible to you
        and barangay staff.
      </Text>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <ComboSelect
        label="What kind of complaint?"
        value={type}
        onChange={setType}
        suggestions={suggestions}
        placeholder="Describe the complaint type"
        required
        hint="Pick a suggestion or tap ✎ Custom to type your own."
      />
      {fieldErrors.type ? <Text style={styles.fieldError}>{fieldErrors.type}</Text> : null}

      <Input
        label="Subject"
        value={subject}
        onChangeText={setSubject}
        placeholder="Short title, e.g. Broken street light"
        required
        error={fieldErrors.subject}
      />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="What happened? Include details like time and people involved."
        multiline
        required
        error={fieldErrors.description}
      />
      <Input
        label="Location"
        value={location}
        onChangeText={setLocation}
        placeholder="Where is this happening?"
        hint="Purok, street, landmark, or exact address."
      />
      <ImagePickerField
        label="Attach a photo (optional)"
        value={image}
        onChange={setImage}
        hint="A photo helps staff verify the complaint."
      />

      <Button title="Submit complaint" onPress={submit} loading={busy} size="lg" />
      <View style={styles.footer}>
        <Button title="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fonts.xl, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  subtitle: { fontSize: fonts.md, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  fieldError: { color: colors.danger, fontSize: fonts.sm, marginTop: -spacing.sm, marginBottom: spacing.md },
  footer: { marginTop: spacing.md },
});
