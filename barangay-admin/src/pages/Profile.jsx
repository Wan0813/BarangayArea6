import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import PasswordInput from '../components/PasswordInput';
import ImageUpload from '../components/ImageUpload';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { profile as profileApi } from '../api/endpoints';
import { resolveFileUrl } from '../api/client';
import { ROLE_LABELS, errorMessage, formatDateTime } from '../utils/format';

export default function Profile() {
  const { user, refreshMe } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    age: user?.age ?? '',
    contactNumber: user?.contactNumber || '',
    address: user?.address || '',
  });
  const [profileBusy, setProfileBusy] = useState(false);

  const [photo, setPhoto] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordBusy, setPasswordBusy] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error('Full name and email are required.');
      return;
    }
    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      age: form.age === '' ? null : Number(form.age),
      contactNumber: form.contactNumber,
      address: form.address,
    };

    setProfileBusy(true);
    try {
      try {
        await profileApi.updateMe(payload);
      } catch (err) {
        // Older backends only expose PUT /users/{id}.
        if (!user?.id) throw err;
        await profileApi.update(user.id, payload);
      }
      toast.success('Profile updated.');
      await refreshMe();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setProfileBusy(false);
    }
  }

  async function savePhoto() {
    if (!photo) {
      toast.error('Choose an image first.');
      return;
    }
    setPhotoBusy(true);
    try {
      if (user?.id) {
        try {
          await profileApi.uploadMyPhoto(photo);
        } catch (err) {
          await profileApi.uploadPhoto(user.id, photo);
        }
      } else {
        await profileApi.uploadMyPhoto(photo);
      }
      toast.success('Photo updated.');
      setPhoto(null);
      await refreshMe();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (!passwords.currentPassword) {
      toast.error('Enter your current password.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('The new password must be at least 6 characters.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('The new passwords do not match.');
      return;
    }

    setPasswordBusy(true);
    try {
      await profileApi.changePassword(passwords);
      toast.success('Password changed.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="My Profile" subtitle="Update your details and password." />

      <div className="grid-2">
        <section className="panel">
          <header className="panel-head">
            <h2>Account</h2>
            <StatusBadge status={user?.status} />
          </header>

          <dl className="detail-list">
            <dt>Username</dt>
            <dd>{user?.username || '—'}</dd>
            <dt>Role</dt>
            <dd>{ROLE_LABELS[user?.role] || user?.role || '—'}</dd>
            <dt>Position</dt>
            <dd>{user?.position || '—'}</dd>
            <dt>Household</dt>
            <dd>{user?.householdNumber || '—'}</dd>
            <dt>Registered</dt>
            <dd>{formatDateTime(user?.createdAt)}</dd>
            <dt>Last login</dt>
            <dd>{formatDateTime(user?.lastLoginAt)}</dd>
          </dl>

          <h3>Profile photo</h3>
          {user?.photoUrl ? (
            <img className="lightbox-image" src={resolveFileUrl(user.photoUrl)} alt="Profile" />
          ) : (
            <p className="muted">No photo uploaded yet.</p>
          )}
          <ImageUpload label="Change photo" value={photo} onChange={setPhoto} />
          <div className="actions-row">
            <button type="button" className="btn btn-primary" onClick={savePhoto} disabled={photoBusy || !photo}>
              {photoBusy ? 'Uploading…' : 'Upload photo'}
            </button>
          </div>
        </section>

        <section className="panel">
          <header className="panel-head">
            <h2>Personal details</h2>
          </header>

          <form onSubmit={saveProfile}>
            <FormField label="Full name" htmlFor="pf-name" required>
              <input
                id="pf-name"
                type="text"
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              />
            </FormField>

            <FormField label="Email" htmlFor="pf-email" required>
              <input
                id="pf-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </FormField>

            <FormField label="Age" htmlFor="pf-age">
              <input
                id="pf-age"
                type="number"
                min="1"
                max="120"
                value={form.age}
                onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))}
              />
            </FormField>

            <FormField label="Contact number" htmlFor="pf-contact">
              <input
                id="pf-contact"
                type="tel"
                value={form.contactNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, contactNumber: event.target.value }))}
              />
            </FormField>

            <FormField label="Address" htmlFor="pf-address">
              <textarea
                id="pf-address"
                rows={3}
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </FormField>

            <div className="actions-row">
              <button type="submit" className="btn btn-primary" disabled={profileBusy}>
                {profileBusy ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <header className="panel-head">
            <h2>Change password</h2>
          </header>

          <form onSubmit={changePassword}>
            <FormField label="Current password" htmlFor="pf-current" required>
              <PasswordInput
                id="pf-current"
                autoComplete="current-password"
                value={passwords.currentPassword}
                onChange={(event) => setPasswords((prev) => ({ ...prev, currentPassword: event.target.value }))}
              />
            </FormField>

            <FormField label="New password" htmlFor="pf-new" required hint="At least 6 characters.">
              <PasswordInput
                id="pf-new"
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(event) => setPasswords((prev) => ({ ...prev, newPassword: event.target.value }))}
              />
            </FormField>

            <FormField label="Confirm new password" htmlFor="pf-confirm" required>
              <PasswordInput
                id="pf-confirm"
                autoComplete="new-password"
                value={passwords.confirmPassword}
                onChange={(event) => setPasswords((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              />
            </FormField>

            <div className="actions-row">
              <button type="submit" className="btn btn-primary" disabled={passwordBusy}>
                {passwordBusy ? 'Saving…' : 'Change password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
