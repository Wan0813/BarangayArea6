import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import FormField from '../components/FormField';
import PasswordInput from '../components/PasswordInput';
import { auth } from '../api/endpoints';
import { config } from '../config';
import { errorMessage } from '../utils/format';

const STEPS = ['Email', 'Verification code', 'New password'];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function sendCode(event) {
    event.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Enter the email address on your account.');
      return;
    }
    setBusy(true);
    try {
      const data = await auth.forgotPassword(email.trim());
      toast.success('A 6-digit code has been sent to your email.');
      if (data?.devCode) toast.info(`Development code: ${data.devCode}`);
      setStep(1);
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setBusy(true);
    try {
      await auth.verifyResetCode(email.trim(), code.trim());
      toast.success('Code verified. Choose a new password.');
      setStep(2);
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError('');
    if (!passwords.newPassword || passwords.newPassword.length < 6) {
      setError('Use a password with at least 6 characters.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await auth.resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      });
      toast.success('Password updated. You can sign in now.');
      navigate('/login', { replace: true });
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-head">
          <span className="brand-mark" aria-hidden="true">
            🔐
          </span>
          <h1>Reset your password</h1>
          <p className="muted small">
            {config.barangayName} · {config.appName}
          </p>
        </div>

        <div className="steps">
          {STEPS.map((label, index) => (
            <div key={label} className={`step${index <= step ? ' is-active' : ''}`}>
              {index + 1}. {label}
            </div>
          ))}
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        {step === 0 ? (
          <form onSubmit={sendCode}>
            <FormField label="Email address" htmlFor="fp-email" required hint="We email a 6-digit verification code.">
              <input id="fp-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </FormField>
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Sending…' : 'Send verification code'}
            </button>
          </form>
        ) : null}

        {step === 1 ? (
          <form onSubmit={verifyCode}>
            <FormField label="6-digit code" htmlFor="fp-code" required hint={`Sent to ${email}`}>
              <input
                id="fp-code"
                className="code-input"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              />
            </FormField>
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Verifying…' : 'Verify code'}
            </button>
            <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: '0.5rem' }} onClick={() => setStep(0)} disabled={busy}>
              Use a different email
            </button>
          </form>
        ) : null}

        {step === 2 ? (
          <form onSubmit={resetPassword}>
            <FormField label="New password" htmlFor="fp-pass" required hint="At least 6 characters.">
              <PasswordInput
                id="fp-pass"
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(event) => setPasswords((prev) => ({ ...prev, newPassword: event.target.value }))}
              />
            </FormField>
            <FormField label="Confirm new password" htmlFor="fp-pass2" required>
              <PasswordInput
                id="fp-pass2"
                autoComplete="new-password"
                value={passwords.confirmPassword}
                onChange={(event) => setPasswords((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              />
            </FormField>
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Saving…' : 'Change password'}
            </button>
          </form>
        ) : null}

        <div className="auth-foot">
          <span>
            Remembered it? <Link to="/login">Back to sign in</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
