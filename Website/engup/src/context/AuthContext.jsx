import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { Storage } from '../services/storage';
import { setUnauthorizedHandler } from '../services/apiClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (Storage.getAccessToken() ? Storage.getUser() : null));

  const login = useCallback(async (credentials) => {
    const u = await authService.login(credentials);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  // Phiên hết hạn hoàn toàn -> tự về màn đăng nhập.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
