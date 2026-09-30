import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorBanner from '../components/ErrorBanner';
import { auth } from '../api';
import { colors, fonts, spacing } from '../theme';

const STEPS = { EMAIL: 1, CODE: 2, RESET: 3 };

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Enter the email address of your account.');
      return;
    }
    setBusy(true);
    try {
      await auth.forgotPassword(email.trim());
      setInfo('We emailed you a 6-digit reset code. Enter it below.');
      setStep(STEPS.CODE);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setError('');
    setInfo('');
    if (!code.trim()) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setBusy(true);
    try {
      await auth.verifyResetCode(email.trim(), code.trim());
      setInfo('Code verified. Choose a new password.');
      setStep(STEPS.RESET);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setError('');
    setInfo('');
    if (!newPassword || newPassword.length < 6) {
      setError('Your new password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await auth.resetPassword(email.trim(), code.trim(), newPassword, confirmPassword);
      navigation.navigate('Login', { notice: 'Password reset successful. Please log in.' });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard>
      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.subtitle}>Step {step} of 3</Text>

      {info ? (
        <View style={styles.info}>
          <Text style={styles.infoText}>{info}</Text>
        </View>
      ) : null}

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {step === STEPS.EMAIL ? (
        <>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            required
            onSubmitEditing={sendCode}
          />
          <Button title="Send reset code" onPress={sendCode} loading={busy} size="lg" />
        </>
      ) : null}

      {step === STEPS.CODE ? (
        <>
          <Input label="Email" value={email} editable={false} />
          <Input
            label="6-digit code"
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            required
            onSubmitEditing={verifyCode}
          />
          <Button title="Verify code" onPress={verifyCode} loading={busy} size="lg" />
          <View style={styles.row}>
            <Button title="Resend code" variant="ghost" onPress={sendCode} />
            <Button title="Change email" variant="ghost" onPress={() => setStep(STEPS.EMAIL)} />
          </View>
        </>
      ) : null}

      {step === STEPS.RESET ? (
        <>
          <Input
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            autoCapitalize="none"
            required
          />
          <Input
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat your new password"
            secureTextEntry
            autoCapitalize="none"
            required
          />
          <Button title="Reset password" onPress={resetPassword} loading={busy} size="lg" />
        </>
      ) : null}

      <View style={styles.footer}>
        <Button title="Back to log in" variant="ghost" onPress={() => navigation.navigate('Login')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fonts.xl, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  subtitle: { fontSize: fonts.sm, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  info: { backgroundColor: colors.infoSoft, borderRadius: 10, padding: spacing.md, marginBottom: spacing.md },
  infoText: { color: colors.info, fontSize: fonts.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  footer: { marginTop: spacing.lg },
});
