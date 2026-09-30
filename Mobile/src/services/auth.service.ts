import { apiFetch } from './api';

export type User = { id: string; name: string; email: string; level: string; goal: string; dailyMinutes: number; streak: number; };
export type AuthTokens = { accessToken: string; refreshToken: string; user: User; };

export const register = (data: { name: string; email: string; password: string; goal?: string; dailyMinutes?: number }) => apiFetch<AuthTokens>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const login = (data: { email: string; password: string }) => apiFetch<AuthTokens>('/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const refresh = (data: { refreshToken: string }) => apiFetch<AuthTokens>('/auth/refresh', { method: 'POST', body: JSON.stringify(data) });
export const logout = (data: { refreshToken: string }) => apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST', body: JSON.stringify(data) });
export const getMe = () => apiFetch<User>('/auth/me');
export const updateMe = (data: { name?: string; goal?: string; dailyMinutes?: number }) => apiFetch<User>('/auth/me', { method: 'PUT', body: JSON.stringify(data) });
export const getPlacementTestQuestions = () => apiFetch<any[]>('/auth/placement-test/questions');
export const submitPlacementTest = (data: { answers: Array<{ questionId: string; answer: string }> }) => apiFetch<{ level: string }>('/auth/placement-test/submit', { method: 'POST', body: JSON.stringify(data) });
