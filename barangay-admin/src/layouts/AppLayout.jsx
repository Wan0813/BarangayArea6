import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { config } from '../config';
import { ROLE_LABELS } from '../utils/format';

/**
 * Sidebar + topbar shell.  Navigation items are filtered by role so a
 * Resident only ever sees their read-only complaint view.
 */
export default function AppLayout() {
  const { user, isAdmin, isHeadAdmin, isResident, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role;

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', roles: ['Admin', 'HeadAdmin'], icon: '📊' },
    { to: '/complaints', label: isResident ? 'My Complaints' : 'Complaints', roles: null, icon: '📝' },
    { to: '/emergencies', label: 'Emergencies', roles: ['Admin', 'HeadAdmin'], icon: '🚨' },
    { to: '/operations', label: 'Daily Operations', roles: ['Admin', 'HeadAdmin'], icon: '🧹' },
    { to: '/duty-roster', label: 'Duty Roster', roles: ['Admin', 'HeadAdmin'], icon: '🗓️' },
    { to: '/households', label: 'Households', roles: ['Admin', 'HeadAdmin'], icon: '🏠' },
    { to: '/accounts', label: 'Accounts', roles: ['Admin', 'HeadAdmin'], icon: '👥' },
    { to: '/staff', label: 'Staff', roles: ['HeadAdmin'], icon: '🛡️' },
    { to: '/announcements', label: 'Announcements', roles: ['Admin', 'HeadAdmin'], icon: '📢' },
    { to: '/about', label: 'About', roles: ['Admin', 'HeadAdmin'], icon: 'ℹ️' },
    { to: '/profile', label: 'My Profile', roles: null, icon: '🙋' },
  ].filter((item) => !item.roles || item.roles.includes(role));

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const initials = (user?.fullName || user?.username || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            🏛️
          </span>
          <span className="brand-text">
            <strong>{config.barangayName}</strong>
            <small>Admin Dashboard</small>
          </span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <p className="muted small">{config.municipality}</p>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            <span className="topbar-app">{config.appName}</span>
            <span className="topbar-sub">{config.barangayName}</span>
          </div>

          <div className="user-chip">
            <span className="avatar" aria-hidden="true">
              {initials || '?'}
            </span>
            <span className="user-chip-text">
              <strong>{user?.fullName || user?.username}</strong>
              <small>
                {ROLE_LABELS[role] || role || 'Account'}
                {user?.position ? ` · ${user.position}` : ''}
              </small>
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>
            {config.appName} · {config.barangayName} · {config.municipality}
          </span>
          {isHeadAdmin ? <span className="badge badge-head-admin">Head Admin access</span> : null}
          {isAdmin && !isHeadAdmin ? <span className="badge badge-admin">Admin access</span> : null}
          {isResident ? <span className="badge badge-resident">Read-only access</span> : null}
        </footer>
      </div>
    </div>
  );
}
