import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'hl_token';
const USER_KEY  = 'hl_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // ── Login ────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY,  JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Logout ───────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // ── Validate token on mount (check if expired) ───────
  useEffect(() => {
    if (!token) return;
    try {
      // Decode payload (not verification — just expiry check client-side)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        console.warn('[Auth] Token expired — logging out.');
        logout();
      }
    } catch {
      logout();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      token, user, isAuthenticated, isLoading, authError,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
