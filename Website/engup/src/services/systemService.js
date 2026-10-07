import { api } from './apiClient';
import {
  API_ADMIN_SYSTEM_STREAK_CHECK, API_ADMIN_SYSTEM_STREAK_RUN, API_ADMIN_SYSTEM_NOTIF_CHECK,
  API_ADMIN_SYSTEM_NOTIF_TEST, API_ADMIN_SYSTEM_NOTIF_RUN, API_ADMIN_SYSTEM_ML_CHECK,
} from '../constants/api';

export const systemService = {
  checkStreak: () => api.get(API_ADMIN_SYSTEM_STREAK_CHECK),
  runStreak: (date) => api.post(API_ADMIN_SYSTEM_STREAK_RUN, date ? { date } : {}),
  checkNotifications: () => api.get(API_ADMIN_SYSTEM_NOTIF_CHECK),
  sendTestNotification: (userId) => api.post(API_ADMIN_SYSTEM_NOTIF_TEST, userId ? { user_id: userId } : {}),
  runReminder: () => api.post(API_ADMIN_SYSTEM_NOTIF_RUN, {}),
  checkMl: () => api.get(API_ADMIN_SYSTEM_ML_CHECK),
};
