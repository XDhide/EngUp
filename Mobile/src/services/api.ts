import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://10.0.2.2:3000/api'; // Android emulator → localhost

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getAccessToken = () => AsyncStorage.getItem('accessToken');
export const getRefreshToken = () => AsyncStorage.getItem('refreshToken');
export const setTokens = async (access: string, refresh: string) => {
  await AsyncStorage.setItem('accessToken', access);
  await AsyncStorage.setItem('refreshToken', refresh);
};
export const clearTokens = async () => {
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('refreshToken');
};

// ─── Core fetcher ─────────────────────────────────────────────────────────────
type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
};

async function buildUrl(path: string, params?: RequestOptions['params']) {
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }
  return url;
}

export async function apiFetch<T = unknown>(
  path: string,
  { method = 'GET', body, params, skipAuth = false }: RequestOptions = {},
): Promise<T> {
  const url = await buildUrl(path, params);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !skipAuth) {
    // Try token refresh
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        await setTokens(data.accessToken, data.refreshToken);
        // Retry original request
        headers['Authorization'] = `Bearer ${data.accessToken}`;
        const retryRes = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!retryRes.ok) {
          const err = await retryRes.json().catch(() => ({}));
          throw new ApiError(retryRes.status, err.message ?? 'Request failed');
        }
        return retryRes.json() as Promise<T>;
      }
    }
    await clearTokens();
    throw new ApiError(401, 'Phiên đăng nhập đã hết hạn');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.message ?? 'Yêu cầu thất bại');
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
