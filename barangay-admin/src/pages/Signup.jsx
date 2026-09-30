import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import FormField from '../components/FormField';
import PasswordInput from '../components/PasswordInput';
import ImageUpload from '../components/ImageUpload';
import { auth } from '../api/endpoints';
import { config } from '../config';
import { VALID_ID_TYPES, errorMessage } from '../utils/format';

const INITIAL = {
  registerAs: 'Resident',
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

export default function Signup() {
  const { isAuthenticated, isResident, booting } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(INITIAL);
  const [validId, setValidId] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (!booting && isAuthenticated) {
    return <Navigate to={isResident ? '/complaints' : '/dashboard'} replace />;
  }

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required.';
    if (!form.username.trim()) next.username = 'Username is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 6) next.password = 'Use at least 6 characters.';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.';
    if (!form.age) next.age = 'Age is required.';
    else if (Number(form.age) <= 0 || Number(form.age) > 120) next.age = 'Enter a valid age.';
    if (!form.contactNumber.trim()) next.contactNumber = 'Contact number is required.';
    if (!form.address.trim()) next.address = 'Address is required.';
    if (!form.validIdType) next.validIdType = 'Select the ID type you are submitting.';
    if (!validId) next.validId = 'A photo of your valid ID is required.';
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setBusy(true);
    try {
      await auth.register(
        {
          registerAs: form.registerAs,
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          age: Number(form.age),
          contactNumber: form.contactNumber.trim(),
          address: form.address.trim(),
          validIdType: form.validIdType,
        },
        validId,
      );
      toast.success(
        'Registration submitted. A Head Admin must approve your account before you can sign in.',
      );
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-head">
          <span className="brand-mark" aria-hidden="true">
            🏛️
          </span>
          <h1>Create an account</h1>
          <p className="muted small">
            {config.barangayName} · {config.municipality}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <FormField label="I am registering as" htmlFor="su-role" required>
              <select id="su-role" value={form.registerAs} onChange={(event) => update('registerAs', event.target.value)}>
                <option value="Resident">Resident</option>
                <option value="Admin">Barangay Admin / Staff</option>
              </select>
            </FormField>

            <FormField label="Full name" htmlFor="su-name" required error={errors.fullName}>
              <input id="su-name" type="text" value={form.fullName} onChange={(event) => update('fullName', event.target.value)} />
            </FormField>

            <FormField label="Username" htmlFor="su-user" required error={errors.username}>
              <input id="su-user" type="text" value={form.username} onChange={(event) => update('username', event.target.value)} />
            </FormField>

            <FormField label="Email" htmlFor="su-email" required error={errors.email}>
              <input id="su-email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
            </FormField>

            <FormField label="Age" htmlFor="su-age" required error={errors.age}>
              <input id="su-age" type="number" min="1" max="120" value={form.age} onChange={(event) => update('age', event.target.value)} />
            </FormField>

            <FormField label="Contact number" htmlFor="su-contact" required error={errors.contactNumber}>
              <input id="su-contact" type="tel" value={form.contactNumber} onChange={(event) => update('contactNumber', event.target.value)} />
            </FormField>

            <FormField label="Password" htmlFor="su-pass" required error={errors.password} hint="At least 6 characters.">
              <PasswordInput id="su-pass" autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} />
            </FormField>

            <FormField label="Confirm password" htmlFor="su-pass2" required error={errors.confirmPassword}>
              <PasswordInput
                id="su-pass2"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => update('confirmPassword', event.target.value)}
              />
            </FormField>

            <FormField label="Home address" htmlFor="su-address" required error={errors.address} className="span-2">
              <textarea
                id="su-address"
                rows={2}
                value={form.address}
                onChange={(event) => update('address', event.target.value)}
              />
            </FormField>

            <FormField label="Valid ID type" htmlFor="su-idtype" required error={errors.validIdType}>
              <select id="su-idtype" value={form.validIdType} onChange={(event) => update('validIdType', event.target.value)}>
                <option value="">Select an ID type…</option>
                {VALID_ID_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </FormField>

            <ImageUpload
              label="Photo of your valid ID"
              value={validId}
              onChange={setValidId}
              required
              help="Required. Clear photo of the front of your ID (JPG/PNG, max 5 MB)."
            />
            {errors.validId ? <p className="field-error">{errors.validId}</p> : null}
          </div>

          <div className="note">
            {form.registerAs === 'Admin'
              ? 'Admin/staff sign-ups are reviewed by the Head Admin before the account is activated.'
              : 'Resident accounts must be approved by a barangay admin before you can sign in.'}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit registration'}
          </button>
        </form>

        <div className="auth-foot">
          <span>
            Already registered? <Link to="/login">Sign in</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
