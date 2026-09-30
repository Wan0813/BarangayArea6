import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorBanner from '../components/ErrorBanner';
import ImagePickerField from '../components/ImagePickerField';
import ComboSelect from '../components/ComboSelect';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing } from '../theme';

const ID_TYPES = [
  'Philippine National ID (PhilSys)',
  "Driver's License",
  'Passport',
  'UMID',
  'Voter\u2019s ID',
  "Senior Citizen's ID",
  'Barangay Certificate',
];

const initialForm = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: '',
  contactNumber: '',
  address: '',
  validIdType: '',
};

export default function SignupScreen({ navigation }) {
  const { register, busy } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [validId, setValidId] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = 'Full name is required.';
    if (!form.username.trim()) errors.username = 'Username is required.';
    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    if (!form.password) errors.password = 'Password is required.';
    else if (form.password.length < 6) errors.password = 'Use at least 6 characters.';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (!form.age.trim()) errors.age = 'Age is required.';
    else if (Number.isNaN(Number(form.age))) errors.age = 'Age must be a number.';
    if (!form.contactNumber.trim()) errors.contactNumber = 'Contact number is required.';
    if (!form.address.trim()) errors.address = 'Address is required.';
    if (!form.validIdType.trim()) errors.validIdType = 'Select or type your valid ID type.';
    if (!validId) errors.validId = 'A photo of your valid ID is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async () => {
    setError('');
    if (!validate()) {
      setError('Please fix the highlighted fields.');
      return;
    }
    try {
      await register(
        {
          ...form,
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          age: Number(form.age),
          contactNumber: form.contactNumber.trim(),
          address: form.address.trim(),
          registerAs: 'Resident',
        },
        validId
      );
      Alert.alert(
        'Registration submitted',
        'Your account is pending approval by barangay staff. You will be able to log in once it is approved.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
      setForm(initialForm);
      setValidId(null);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Screen keyboard>
      <Text style={styles.title}>Create your resident account</Text>
      <Text style={styles.subtitle}>
        Fill in all fields. Your valid ID photo is required for verification.
      </Text>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <Input
        label="Full name"
        value={form.fullName}
        onChangeText={set('fullName')}
        placeholder="Juan Dela Cruz"
        required
        error={fieldErrors.fullName}
      />
      <Input
        label="Username"
        value={form.username}
        onChangeText={set('username')}
        placeholder="juan.delacruz"
        autoCapitalize="none"
        required
        error={fieldErrors.username}
      />
      <Input
        label="Email"
        value={form.email}
        onChangeText={set('email')}
        placeholder="juan@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        required
        error={fieldErrors.email}
      />
      <Input
        label="Password"
        value={form.password}
        onChangeText={set('password')}
        placeholder="At least 6 characters"
        secureTextEntry
        autoCapitalize="none"
        required
        error={fieldErrors.password}
      />
      <Input
        label="Confirm password"
        value={form.confirmPassword}
        onChangeText={set('confirmPassword')}
        placeholder="Repeat your password"
        secureTextEntry
        autoCapitalize="none"
        required
        error={fieldErrors.confirmPassword}
      />
      <Input
        label="Age"
        value={form.age}
        onChangeText={set('age')}
        placeholder="e.g. 28"
        keyboardType="number-pad"
        required
        error={fieldErrors.age}
      />
      <Input
        label="Contact number"
        value={form.contactNumber}
        onChangeText={set('contactNumber')}
        placeholder="09XXXXXXXXX"
        keyboardType="phone-pad"
        required
        error={fieldErrors.contactNumber}
      />
      <Input
        label="Address"
        value={form.address}
        onChangeText={set('address')}
        placeholder="House no., street, purok"
        multiline
        required
        error={fieldErrors.address}
      />

      <ComboSelect
        label="Valid ID type"
        value={form.validIdType}
        onChange={set('validIdType')}
        suggestions={ID_TYPES}
        placeholder="Type your valid ID type"
        required
        hint="Pick a suggested ID or tap Custom to type your own."
      />

      <ImagePickerField
        label="Valid ID photo"
        required
        value={validId}
        onChange={setValidId}
        hint="Take a clear photo of your valid ID."
      />

      {fieldErrors.validId ? <Text style={styles.fieldError}>{fieldErrors.validId}</Text> : null}

      <Button title="Submit registration" onPress={submit} loading={busy} size="lg" />

      <View style={styles.footer}>
        <Button title="Back to log in" variant="ghost" onPress={() => navigation.navigate('Login')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fonts.xl, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  subtitle: { fontSize: fonts.md, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  fieldError: { color: colors.danger, fontSize: fonts.sm, marginTop: -spacing.sm, marginBottom: spacing.md },
  footer: { marginTop: spacing.lg },
});
