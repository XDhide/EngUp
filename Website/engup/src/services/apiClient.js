import { Storage } from './storage';
import { API_ADMIN_AUTH_LOGIN, API_AUTH_REFRESH } from '../constants/api';

/** Địa chỉ API lấy từ VITE_API_URL (Website/engup/.env), mặc định http://localhost:5000/api */
export const getBaseUrl = () =>
  (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// AuthContext đăng ký callback này để tự đăng xuất khi phiên hết hạn hoàn toàn.
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => { unauthorizedHandler = fn; };

const AUTH_ENDPOINTS = [API_ADMIN_AUTH_LOGIN, API_AUTH_REFRESH];
const isAuthEndpoint = (endpoint) => AUTH_ENDPOINTS.some((e) => endpoint.includes(e));

let refreshPromise = null;

// Chỉ một request refresh chạy tại một thời điểm; các request 401 khác chờ chung kết quả.
function refreshAccessToken(baseUrl) {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = Storage.getRefreshToken();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${baseUrl}${API_AUTH_REFRESH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data?.access_token) {
        Storage.setAccessToken(json.data.access_token);
        return json.data.access_token;
      }
      return null;
    } catch {
      return null;
    }
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

function doFetch(url, options, token) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  // FormData (upload audio) để trình duyệt tự gắn Content-Type + boundary.
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

/** Ghép query string, bỏ qua giá trị rỗng/undefined. */
export const buildQuery = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    let response = await doFetch(url, options, Storage.getAccessToken());

    if (response.status === 401 && !isAuthEndpoint(endpoint)) {
      const newToken = await refreshAccessToken(baseUrl);
      if (newToken) {
        response = await doFetch(url, options, newToken);
      } else {
        Storage.clearAuth();
        unauthorizedHandler?.();
      }
    }

    const json = await response.json().catch(() => ({
      success: response.ok,
      message: response.statusText,
      data: null,
    }));

    if (!response.ok || json.success === false) {
      throw new ApiError(json.message || `Lỗi yêu cầu (${response.status})`, response.status, json);
    }
    return json.data !== undefined ? json.data : json;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng hoặc địa chỉ API (VITE_API_URL).', 0, error);
  }
}

const body = (data) => (data instanceof FormData ? data : JSON.stringify(data ?? {}));

export const api = {
  get: (endpoint, params) => apiRequest(`${endpoint}${buildQuery(params)}`),
  post: (endpoint, data) => apiRequest(endpoint, { method: 'POST', body: body(data) }),
  put: (endpoint, data) => apiRequest(endpoint, { method: 'PUT', body: body(data) }),
  del: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

export const errorMessage = (e, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.') =>
  e instanceof Error && e.message ? e.message : fallback;
