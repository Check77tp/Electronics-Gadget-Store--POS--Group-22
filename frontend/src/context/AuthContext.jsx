import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient, { getErrorMessage } from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = 'gadgetpos_token';
const USER_KEY = 'gadgetpos_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  // true while we validate a persisted session against GET /api/auth/me on mount
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/api/auth/me');
        if (!cancelled) {
          setUser(res.data);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data));
        }
      } catch {
        // Invalid/expired token: log out silently, per spec.
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    validateSession();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const res = await apiClient.post('/api/auth/login', { username, password });
      const { access_token, user: loggedInUser } = res.data;
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
      setToken(access_token);
      setUser(loggedInUser);
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, 'Login failed. Please try again.'), status: error?.response?.status };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      logout,
      hasRole,
    }),
    [user, token, isLoading, login, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
