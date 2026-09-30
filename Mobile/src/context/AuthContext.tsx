import React, { createContext, useContext, useState, useEffect } from 'react';
import { Storage } from '../services/storage';
import { authService, UserProfile } from '../services/authService';
import { setUnauthorizedHandler } from '../services/apiClient';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCachedAuth = async () => {
    try {
      const token = await Storage.getAccessToken();
      const cachedUser = await Storage.getUser();
      if (token && cachedUser) {
        setUser(cachedUser);
        // Async verify/refresh from server
        authService.getMe().then((freshUser) => {
          setUser(freshUser);
        }).catch(() => {
          // ignore network failure on startup
        });
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // apiClient gọi callback này khi refresh token thất bại -> quay về màn đăng nhập.
    setUnauthorizedHandler(() => setUser(null));
    loadCachedAuth();
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await authService.login(data);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; full_name: string }) => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
    } catch {
      // ignore
    }
  };

  const updateUser = async (data: Partial<UserProfile>) => {
    const { level_current, learning_goal, daily_target_minutes } = data;
    const updated = await authService.updateProfile({
      ...(level_current !== undefined && { level_current }),
      ...(learning_goal !== undefined && { learning_goal }),
      ...(daily_target_minutes !== undefined && { daily_target_minutes }),
    });
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
