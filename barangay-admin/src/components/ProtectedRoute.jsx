import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

/**
 * Route guard. `roles` is an optional allow-list of Role values.
 */
export default function ProtectedRoute({ roles, children }) {
  const { booting, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (booting) return <Loading label="Checking your session…" full />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(user?.role)) {
    return (
      <div className="panel not-allowed">
        <h2>Not available for your account</h2>
        <p>
          This section is limited to {roles.join(' / ')} accounts. Your account role is{' '}
          <strong>{user?.role || 'unknown'}</strong>.
        </p>
        <p className="muted">If you believe this is a mistake, ask the Head Admin to update your role.</p>
      </div>
    );
  }

  return children;
}
