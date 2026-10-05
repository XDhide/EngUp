import { apiRequest } from './apiClient';
import {
  API_NOTIFICATIONS,
  API_NOTIFICATIONS_SETTINGS,
  API_NOTIFICATION_READ,
} from './api';

export interface NotificationSettings {
  /** "HH:mm" hoặc null nếu chưa đặt */
  daily_reminder_time: string | null;
  review_reminder_enabled: boolean;
}

export interface AppNotification {
  id: number;
  title?: string | null;
  body?: string | null;
  message?: string | null;
  type?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  created_at: string;
}

// MySQL TIME trả "08:00:00" nhưng backend chỉ nhận "HH:mm".
const toHHmm = (t: string | null | undefined): string | null => (t ? t.slice(0, 5) : null);

export const notificationService = {
  async getSettings(): Promise<NotificationSettings> {
    const r = await apiRequest<NotificationSettings>(API_NOTIFICATIONS_SETTINGS);
    return {
      daily_reminder_time: toHHmm(r.daily_reminder_time),
      review_reminder_enabled: !!r.review_reminder_enabled,
    };
  },

  async updateSettings(data: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const r = await apiRequest<NotificationSettings>(API_NOTIFICATIONS_SETTINGS, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return {
      daily_reminder_time: toHHmm(r.daily_reminder_time),
      review_reminder_enabled: !!r.review_reminder_enabled,
    };
  },

  async getNotifications(): Promise<AppNotification[]> {
    const r = await apiRequest<{ notifications: AppNotification[] }>(API_NOTIFICATIONS);
    return r.notifications ?? [];
  },

  async markAsRead(id: number): Promise<void> {
    await apiRequest(API_NOTIFICATION_READ(id), { method: 'PUT' });
  },
};

