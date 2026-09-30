import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import FormField from '../components/FormField';
import PasswordInput from '../components/PasswordInput';
import { config } from '../config';
import { errorMessage } from '../utils/format';

export default function Login() {
  const { login, isAuthenticated, isResident, booting } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ usernameOrEmail: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (!booting && isAuthenticated) {
    return <Navigate to={isResident ? '/complaints' : '/dashboard'} replace />;
  }

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.usernameOrEmail.trim()) nextErrors.usernameOrEmail = 'Enter your username or email.';
    if (!form.password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      const user = await login(form.usernameOrEmail.trim(), form.password);
      toast.success(`Welcome back, ${user?.fullName || user?.username || 'user'}!`);
      navigate(user?.role === 'Resident' ? '/complaints' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-head">
          <span className="brand-mark" aria-hidden="true">
            🏛️
          </span>
          <h1>{config.barangayName}</h1>
          <p className="muted small">
            {config.appName} · Admin Dashboard
            <br />
            {config.municipality}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Username or email" htmlFor="login-user" required error={errors.usernameOrEmail}>
            <input
              id="login-user"
              type="text"
              autoComplete="username"
              value={form.usernameOrEmail}
              onChange={(event) => update('usernameOrEmail', event.target.value)}
            />
          </FormField>

          <FormField label="Password" htmlFor="login-pass" required error={errors.password}>
            <PasswordInput
              id="login-pass"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => update('password', event.target.value)}
            />
          </FormField>

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-foot">
          <span>
            No account yet? <Link to="/signup">Create one</Link>
          </span>
          <span>
            <Link to="/forgot-password">Forgot your password?</Link>
          </span>
          <span className="small">
            New accounts stay <strong>Pending</strong> until a Head Admin approves them.
          </span>
        </div>
      </div>
    </div>
  );
}
