import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { session } from '../api/client';
import { auth } from '../api/endpoints';
import { errorMessage } from '../utils/format';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => session.getToken());
  const [user, setUser] = useState(() => session.getUser());
  const [booting, setBooting] = useState(() => Boolean(session.getToken()));

  const login = useCallback(async (usernameOrEmail, password) => {
    const data = await auth.login(usernameOrEmail, password);
    const newToken = data?.token || data?.accessToken;
    if (!newToken) throw new Error('The server did not return a sign-in token.');
    const newUser = data?.user || null;
    session.set(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    session.clear();
    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const me = await auth.me();
    session.setUser(me);
    setUser(me);
    return me;
  }, []);

  // Validate a stored token once on boot and refresh the cached user.
  useEffect(() => {
    let cancelled = false;
    const stored = session.getToken();
    if (!stored) {
      setBooting(false);
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        const me = await auth.me();
        if (!cancelled) {
          session.setUser(me);
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          session.clear();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => {
    const role = user?.role || null;
    return {
      token,
      user,
      booting,
      role,
      isAuthenticated: Boolean(token),
      isResident: role === 'Resident',
      isHeadAdmin: role === 'HeadAdmin',
      isAdmin: role === 'Admin' || role === 'HeadAdmin',
      isStaff: role === 'Admin' || role === 'HeadAdmin',
      canManageStaff: role === 'HeadAdmin',
      canDelete: role === 'HeadAdmin',
      login,
      logout,
      refreshMe,
      errorMessage,
    };
  }, [token, user, booting, login, logout, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider.');
  return ctx;
}

export default AuthContext;
