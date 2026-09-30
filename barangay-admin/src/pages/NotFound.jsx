import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { config } from '../config';
import logo from '../assets/logo.png';

export default function NotFound() {
  const { isAuthenticated, isResident, logout } = useAuth();
  const navigate = useNavigate();

  function back() {
    if (isAuthenticated) navigate(isResident ? '/complaints' : '/dashboard', { replace: true });
    else navigate('/login', { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-head">
          <img src={logo} alt="Barangay San Jose logo" className="brand-logo brand-logo-lg" />
          <h1>Page not found</h1>
          <p className="muted small">
            {config.barangayName} · {config.appName}
          </p>
        </div>
        <p>We could not find the page you were looking for.</p>
        <button type="button" className="btn btn-primary btn-block" onClick={back}>
          Go to my home page
        </button>
        <div className="auth-foot">
          {isAuthenticated ? (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              Sign out
            </button>
          ) : (
            <Link to="/login">Back to sign in</Link>
          )}
        </div>
      </div>
    </div>
  );
}
