import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Storage } from './storage';

const API_PORT = 5000;

/**
 * Thứ tự ưu tiên xác định địa chỉ API:
 * 1. EXPO_PUBLIC_API_URL (khai báo trong Mobile/.env, ví dụ http://192.168.1.10:5000/api)
 * 2. Cùng IP với máy đang chạy Expo dev server (dùng được cho điện thoại thật qua Expo Go)
 * 3. Android emulator -> 10.0.2.2, còn lại -> localhost
 */
export const getBaseUrl = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri && Platform.OS !== 'web') {
    const host = hostUri.split(':')[0];
    if (host) return `http://${host}:${API_PORT}/api`;
  }

  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}/api`;
  return `http://localhost:${API_PORT}/api`;
};

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number = 500, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// AuthContext đăng ký callback này để tự đăng xuất khi phiên hết hạn hoàn toàn.
let unauthorizedHandler: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  unauthorizedHandler = fn;
};

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];
const isAuthEndpoint = (endpoint: string) => AUTH_ENDPOINTS.some((e) => endpoint.includes(e));

let refreshPromise: Promise<string | null> | null = null;

// Chỉ có một request refresh chạy tại một thời điểm; các request 401 khác chờ chung kết quả.
async function refreshAccessToken(baseUrl: string): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await Storage.getRefreshToken();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const json: ApiResponse<{ access_token: string }> = await res.json();
      if (res.ok && json.success && json.data?.access_token) {
        await Storage.setAccessToken(json.data.access_token);
        return json.data.access_token;
      }
      return null;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function doFetch(url: string, options: RequestInit, token: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    let token = await Storage.getAccessToken();
    let response = await doFetch(url, options, token);

    if (response.status === 401 && !isAuthEndpoint(endpoint)) {
      const newToken = await refreshAccessToken(baseUrl);
      if (newToken) {
        response = await doFetch(url, options, newToken);
      } else {
        await Storage.clearAuth();
        unauthorizedHandler?.();
      }
    }

    const json: ApiResponse<T> = await response.json().catch(() => ({
      success: response.ok,
      message: response.statusText,
      data: null as any,
    }));

    if (!response.ok || json.success === false) {
      throw new ApiError(json.message || `Lỗi yêu cầu (${response.status})`, response.status, json);
    }

    return (json.data !== undefined ? json.data : (json as unknown as T)) as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Không kết nối được máy chủ. Kiểm tra mạng hoặc địa chỉ API (EXPO_PUBLIC_API_URL).',
      0,
      error
    );
  }
}

export const errorMessage = (e: unknown, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): string =>
  e instanceof Error && e.message ? e.message : fallback;
