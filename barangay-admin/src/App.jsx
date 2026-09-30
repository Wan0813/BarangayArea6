import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Loading from './components/Loading';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Staff from './pages/Staff';
import Accounts from './pages/Accounts';
import Households from './pages/Households';
import Complaints from './pages/Complaints';
import Emergencies from './pages/Emergencies';
import Operations from './pages/Operations';
import DutyRoster from './pages/DutyRoster';
import Announcements from './pages/Announcements';
import About from './pages/About';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

const STAFF = ['Admin', 'HeadAdmin'];

/** Residents land on their read-only complaint list; staff land on the dashboard. */
function HomeRedirect() {
  const { booting, isAuthenticated, isResident } = useAuth();
  if (booting) return <Loading label="Loading…" full />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isResident ? '/complaints' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomeRedirect />} />
              <Route path="/dashboard" element={<ProtectedRoute roles={STAFF}><Dashboard /></ProtectedRoute>} />
              <Route path="/complaints" element={<Complaints />} />
              <Route path="/emergencies" element={<ProtectedRoute roles={STAFF}><Emergencies /></ProtectedRoute>} />
              <Route path="/operations" element={<ProtectedRoute roles={STAFF}><Operations /></ProtectedRoute>} />
              <Route path="/duty-roster" element={<ProtectedRoute roles={STAFF}><DutyRoster /></ProtectedRoute>} />
              <Route path="/households" element={<ProtectedRoute roles={STAFF}><Households /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute roles={STAFF}><Accounts /></ProtectedRoute>} />
              <Route path="/staff" element={<ProtectedRoute roles={['HeadAdmin']}><Staff /></ProtectedRoute>} />
              <Route path="/announcements" element={<ProtectedRoute roles={STAFF}><Announcements /></ProtectedRoute>} />
              <Route path="/about" element={<ProtectedRoute roles={STAFF}><About /></ProtectedRoute>} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
