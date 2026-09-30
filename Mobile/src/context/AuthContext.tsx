import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMe, login as apiLogin, logout as apiLogout, User, AuthTokens } from '@/services/auth.service';
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from '@/services/api';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (token) {
        try {
          const profile = await getMe();
          setUser(profile);
        } catch {
          await clearTokens();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const data: AuthTokens = await apiLogin({ email, password });
    await setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await apiLogout({ refreshToken });
      }
    } catch {}
    await clearTokens();
    setUser(null);
  };

  const refreshUser = async () => {
    const profile = await getMe();
    setUser(profile);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
