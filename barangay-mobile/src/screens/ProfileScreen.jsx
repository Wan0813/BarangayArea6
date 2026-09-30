import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import Screen from '../components/Screen';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorBanner from '../components/ErrorBanner';
import StatusBadge from '../components/StatusBadge';
import ImagePickerField from '../components/ImagePickerField';
import { auth, profile, resolveFileUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { config } from '../config';
import { colors, fonts, spacing } from '../theme';
import { formatDateTime } from '../utils/format';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateLocalUser, refreshMe } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
  const [age, setAge] = useState(user?.age === undefined || user?.age === null ? '' : String(user.age));
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveInfo, setSaveInfo] = useState('');

  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwInfo, setPwInfo] = useState('');

  const saveProfile = async () => {
    setSaveError('');
    setSaveInfo('');
    if (!fullName.trim()) {
      setSaveError('Full name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        contactNumber: contactNumber.trim(),
        age: age === '' ? null : Number(age),
        address: address.trim(),
      };
      const updated = await profile.update(payload);
      await updateLocalUser(updated && updated.id ? updated : payload);
      setSaveInfo('Profile updated.');
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const changePhoto = async (asset) => {
    setPhoto(asset);
    if (!asset) return;
    setUploading(true);
    setSaveError('');
    setSaveInfo('');
    try {
      const result = await profile.uploadPhoto(asset);
      const url = (result && (result.photoUrl || result.url)) || null;
      if (url) await updateLocalUser({ photoUrl: url });
      else await refreshMe();
      setSaveInfo('Profile photo updated.');
      setPhoto(null);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const changePassword = async () => {
    setPwError('');
    setPwInfo('');
    if (!currentPassword) {
      setPwError('Enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPwError('Your new password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwBusy(true);
    try {
      await auth.changePassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwInfo('Password changed successfully.');
    } catch (e) {
      setPwError(e.message);
    } finally {
      setPwBusy(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const photoUrl = resolveFileUrl(user?.photoUrl);

  return (
    <Screen keyboard>
      <Text style={styles.title}>My profile</Text>

      <Card>
        <View style={styles.identityRow}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.fullName || user?.username || '?').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.flex}>
            <Text style={styles.name}>{user?.fullName || user?.username}</Text>
            <Text style={styles.meta}>@{user?.username}</Text>
            <View style={styles.badges}>
              <StatusBadge status={user?.status} />
              <View style={styles.badgeGap} />
              <StatusBadge status={user?.role} />
            </View>
          </View>
        </View>

        {user?.statusRemarks ? (
          <Text style={styles.remarks}>Staff remarks: {user.statusRemarks}</Text>
        ) : null}
        <Text style={styles.meta}>Member since {formatDateTime(user?.createdAt)}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Profile photo</Text>
        <ImagePickerField
          label=""
          value={photo}
          onChange={changePhoto}
          hint={uploading ? 'Uploading…' : 'Pick a new photo to upload it immediately.'}
          aspect={[1, 1]}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Edit profile</Text>
        <ErrorBanner message={saveError} onDismiss={() => setSaveError('')} />
        {saveInfo ? <Text style={styles.successText}>{saveInfo}</Text> : null}

        <Input label="Full name" value={fullName} onChangeText={setFullName} required />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Contact number"
          value={contactNumber}
          onChangeText={setContactNumber}
          keyboardType="phone-pad"
        />
        <Input label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
        <Input label="Address" value={address} onChangeText={setAddress} multiline />
        <Input label="Username" value={user?.username || ''} editable={false} hint="Usernames cannot be changed." />

        <Button title="Save profile" onPress={saveProfile} loading={saving} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Change password</Text>
        <ErrorBanner message={pwError} onDismiss={() => setPwError('')} />
        {pwInfo ? <Text style={styles.successText}>{pwInfo}</Text> : null}

        <Input
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Input
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Input
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Button title="Change password" onPress={changePassword} loading={pwBusy} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>More</Text>
        <Button title="About the barangay" variant="secondary" onPress={() => navigation.navigate('About')} />
        <View style={styles.gap} />
        <Button title="Daily operations" variant="secondary" onPress={() => navigation.navigate('Operations')} />
        <View style={styles.gap} />
        <Button title="Activity & notifications" variant="secondary" onPress={() => navigation.navigate('Notifications')} />
        <View style={styles.gap} />
        <Button
          title="Refresh my account"
          variant="secondary"
          onPress={async () => {
            try {
              await refreshMe();
            } catch (e) {
              setSaveError(e.message);
            }
          }}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Session</Text>
        <Button title="Log out" variant="danger" onPress={confirmLogout} />
      </Card>

      <Text style={styles.footerNote}>
        {config.barangayName} · {config.municipality}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fonts.xl, fontWeight: '800', color: colors.text, marginTop: spacing.md, marginBottom: spacing.md },
  identityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarImage: { width: 64, height: 64, borderRadius: 32, marginRight: spacing.md, backgroundColor: colors.neutralSoft },
  avatarText: { fontSize: fonts.xxl, fontWeight: '800', color: colors.primaryDark },
  flex: { flex: 1 },
  name: { fontSize: fonts.lg, fontWeight: '700', color: colors.text },
  meta: { fontSize: fonts.sm, color: colors.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', marginTop: spacing.sm },
  badgeGap: { width: spacing.sm },
  remarks: {
    fontSize: fonts.sm,
    color: colors.warning,
    backgroundColor: colors.warningSoft,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: fonts.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  successText: { color: colors.success, fontSize: fonts.md, marginBottom: spacing.md },
  gap: { height: spacing.sm },
  footerNote: { textAlign: 'center', color: colors.textMuted, fontSize: fonts.sm, marginTop: spacing.md },
});
