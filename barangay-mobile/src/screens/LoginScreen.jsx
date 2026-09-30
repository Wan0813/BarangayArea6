import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorBanner from '../components/ErrorBanner';
import { useAuth } from '../context/AuthContext';
import { config } from '../config';
import { colors, fonts, spacing } from '../theme';

export default function LoginScreen({ navigation, route }) {
  const { login, busy } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice] = useState(route?.params?.notice || '');

  const submit = async () => {
    setError('');
    if (!usernameOrEmail.trim() || !password) {
      setError('Please enter your username/email and password.');
      return;
    }
    try {
      await login(usernameOrEmail.trim(), password);
      // RootNavigator switches to the app tabs automatically.
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Screen keyboard>
      <View style={styles.header}>
        <Text style={styles.title}>{config.barangayName}</Text>
        <Text style={styles.subtitle}>Resident Mobile App</Text>
      </View>

      {notice ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <Input
        label="Username or Email"
        value={usernameOrEmail}
        onChangeText={setUsernameOrEmail}
        placeholder="e.g. juan.dela.cruz"
        autoCapitalize="none"
        required
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
        autoCapitalize="none"
        required
        onSubmitEditing={submit}
        returnKeyType="go"
      />

      <Button title="Log in" onPress={submit} loading={busy} size="lg" />

      <View style={styles.links}>
        <Button
          title="Forgot password?"
          variant="ghost"
          onPress={() => navigation.navigate('ForgotPassword')}
        />
        <Button
          title="Create an account"
          variant="outline"
          onPress={() => navigation.navigate('Signup')}
        />
      </View>

      <Text style={styles.footNote}>
        New accounts are reviewed and approved by barangay staff before you can log in.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl },
  title: { fontSize: fonts.xxl, fontWeight: '800', color: colors.primaryDark, textAlign: 'center' },
  subtitle: { fontSize: fonts.md, color: colors.textMuted, marginTop: spacing.xs },
  notice: {
    backgroundColor: colors.successSoft,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: { color: colors.success, fontSize: fonts.md },
  links: { marginTop: spacing.lg, gap: spacing.sm },
  footNote: {
    marginTop: spacing.xl,
    fontSize: fonts.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
