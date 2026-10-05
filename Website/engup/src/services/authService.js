import { api } from './apiClient';
import { Storage } from './storage';
import { API_ADMIN_AUTH_LOGIN, API_AUTH_LOGOUT } from '../constants/api';

export const authService = {
  async login({ email, password }) {
    const data = await api.post(API_ADMIN_AUTH_LOGIN, { email, password });
    Storage.setAccessToken(data.access_token);
    Storage.setRefreshToken(data.refresh_token);
    Storage.setUser(data.user);
    return data.user;
  },

  async logout() {
    try {
      const refreshToken = Storage.getRefreshToken();
      if (refreshToken) await api.post(API_AUTH_LOGOUT, { refresh_token: refreshToken });
    } catch {
      // Dù server lỗi vẫn xoá phiên cục bộ.
    } finally {
      Storage.clearAuth();
    }
  },
};
