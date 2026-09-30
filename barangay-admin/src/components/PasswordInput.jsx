import { useState } from 'react';

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.16 3.19" />
      <path d="M6.61 6.61A17.5 17.5 0 0 0 2 12s3.5 7 10 7a10.7 10.7 0 0 0 4.39-.92" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

/**
 * Password input with a clickable eye button to show/hide the value.
 * Drop-in replacement for `<input type="password" ... />` — accepts the same
 * props (id, value, onChange, autoComplete, placeholder, disabled).
 */
export default function PasswordInput({ id, value, onChange, autoComplete = 'current-password', placeholder, disabled }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-wrap">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
