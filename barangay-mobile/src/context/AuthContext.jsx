import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth } from '../api';
import { SESSION_KEY, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const clearSession = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (e) {
      // ignore
    }
    if (mounted.current) {
      setUser(null);
      setToken(null);
    }
  }, []);

  // Let the API client force a logout when it receives a 401.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const persistSession = useCallback(async (session) => {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      // ignore storage failure — session still lives in memory
    }
    if (mounted.current) {
      setUser(session.user || null);
      setToken(session.token || null);
    }
  }, []);

  // Bootstrap: restore the session, then refresh the user from the API.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          if (!cancelled && session && session.token) {
            setUser(session.user || null);
            setToken(session.token);
          }
        }
      } catch (e) {
        // ignore corrupt session
      } finally {
        if (!cancelled) setInitializing(false);
      }

      // Best-effort refresh of the profile (token invalid → client clears it).
      try {
        const me = await auth.me();
        if (!cancelled && me) {
          setUser(me);
          const raw = await AsyncStorage.getItem(SESSION_KEY);
          const session = raw ? JSON.parse(raw) : {};
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, user: me }));
        }
      } catch (e) {
        // Offline or unauthenticated — keep whatever we restored.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (usernameOrEmail, password) => {
      setBusy(true);
      try {
        const data = await auth.login(usernameOrEmail, password);
        const session = { token: data.token, expiresAt: data.expiresAt, user: data.user };
        await persistSession(session);
        return data.user;
      } finally {
        if (mounted.current) setBusy(false);
      }
    },
    [persistSession]
  );

  const register = useCallback(async (fields, idAsset) => {
    setBusy(true);
    try {
      return await auth.register(fields, idAsset);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const refreshMe = useCallback(async () => {
    const me = await auth.me();
    if (me) {
      setUser(me);
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        const session = raw ? JSON.parse(raw) : {};
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, user: me }));
      } catch (e) {
        // ignore
      }
    }
    return me;
  }, []);

  const updateLocalUser = useCallback(
    async (patch) => {
      let next = null;
      setUser((prev) => {
        next = { ...(prev || {}), ...patch };
        return next;
      });
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        const session = raw ? JSON.parse(raw) : {};
        await AsyncStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ ...session, user: { ...(session.user || {}), ...patch } })
        );
      } catch (e) {
        // ignore
      }
      return next;
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      busy,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      refreshMe,
      updateLocalUser,
      setUser,
    }),
    [user, token, initializing, busy, login, register, logout, refreshMe, updateLocalUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
