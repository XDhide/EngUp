const KEYS = {
  ACCESS: '@engup_admin_access_token',
  REFRESH: '@engup_admin_refresh_token',
  USER: '@engup_admin_user',
};

const safe = (fn, fallback = null) => {
  try { return fn(); } catch { return fallback; }
};

export const Storage = {
  getAccessToken: () => safe(() => localStorage.getItem(KEYS.ACCESS)),
  setAccessToken: (t) => safe(() => localStorage.setItem(KEYS.ACCESS, t)),
  getRefreshToken: () => safe(() => localStorage.getItem(KEYS.REFRESH)),
  setRefreshToken: (t) => safe(() => localStorage.setItem(KEYS.REFRESH, t)),
  getUser: () => safe(() => JSON.parse(localStorage.getItem(KEYS.USER))),
  setUser: (u) => safe(() => localStorage.setItem(KEYS.USER, JSON.stringify(u))),
  clearAuth: () => safe(() => Object.values(KEYS).forEach((k) => localStorage.removeItem(k))),
};
