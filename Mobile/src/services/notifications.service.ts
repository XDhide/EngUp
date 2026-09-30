import { apiFetch } from './api';

export type NotificationSettings = { studyReminder: boolean; reminderTime: string; dailyVocab: boolean; dailyVocabTime: string; aiFeedback: boolean; weeklyReport: boolean; pushEnabled: boolean; emailEnabled: boolean; };
export type AppNotification = { id: string; title: string; body: string; type: string; status: 'read'|'unread'; createdAt: string; actionUrl?: string; };

export const getSettings = () => apiFetch<NotificationSettings>('/notifications/settings');
export const updateSettings = (data: Partial<NotificationSettings>) => apiFetch<NotificationSettings>('/notifications/settings', { method: 'PUT', body: JSON.stringify(data) });
export const getNotifications = (params?: { status?: 'all' | 'unread'; page?: number; limit?: number }) => apiFetch<{ notifications: AppNotification[]; total: number }>('/notifications', { params });
export const markAsRead = (id: string) => apiFetch<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' });
