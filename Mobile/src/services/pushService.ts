import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { apiRequest } from './apiClient';
import { API_NOTIFICATIONS_SETTINGS, API_NOTIFICATIONS_TEST } from './api';

export type PushStatus = 'registered' | 'denied' | 'no_device' | 'no_project' | 'unsupported' | 'error';

export interface PushResult {
  status: PushStatus;
  token?: string;
  message: string;
}

type NotificationsModule = typeof import('expo-notifications');

let notificationsPromise: Promise<NotificationsModule> | null = null;

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const loadNotifications = (): Promise<NotificationsModule> => {
  if (!notificationsPromise) {
    notificationsPromise = import('expo-notifications').then((mod) => {
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      return mod;
    });
  }
  return notificationsPromise;
};

const getProjectId = (): string | undefined => {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return (
    extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    (process.env.EXPO_PUBLIC_EAS_PROJECT_ID || undefined)
  );
};

export const pushService = {
  async register(): Promise<PushResult> {
    if (Platform.OS === 'web') {
      return { status: 'unsupported', message: 'Thông báo đẩy không hỗ trợ trên web.' };
    }
    if (isExpoGo && Platform.OS === 'android') {
      return {
        status: 'unsupported',
        message: 'Expo Go trên Android không nhận được thông báo đẩy. Hãy build bản development (npx expo run:android hoặc eas build --profile development).',
      };
    }
    if (!Device.isDevice) {
      return { status: 'no_device', message: 'Cần điện thoại thật để nhận thông báo đẩy (máy ảo không hỗ trợ).' };
    }
    try {
      const Notifications = await loadNotifications();
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Nhắc học',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      const current = await Notifications.getPermissionsAsync();
      let granted = current.granted;
      if (!granted) {
        const asked = await Notifications.requestPermissionsAsync();
        granted = asked.granted;
      }
      if (!granted) {
        return { status: 'denied', message: 'Bạn chưa cho phép thông báo. Hãy bật quyền thông báo cho ứng dụng trong Cài đặt điện thoại.' };
      }

      const projectId = getProjectId();
      if (!projectId && !isExpoGo) {
        return {
          status: 'no_project',
          message: 'Ứng dụng chưa có Expo projectId. Chạy "npx eas init" trong thư mục Mobile (hoặc đặt EXPO_PUBLIC_EAS_PROJECT_ID trong .env), rồi build lại.',
        };
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      await apiRequest(API_NOTIFICATIONS_SETTINGS, { method: 'PUT', body: JSON.stringify({ push_token: token }) });
      return { status: 'registered', token, message: 'Đã bật thông báo đẩy trên thiết bị này.' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { status: 'error', message: `Không đăng ký được thông báo đẩy: ${msg}` };
    }
  },

  async unregister(): Promise<void> {
    try {
      await apiRequest(API_NOTIFICATIONS_SETTINGS, { method: 'PUT', body: JSON.stringify({ push_token: null }) });
    } catch {}
  },

  async sendTest(): Promise<{ push: string; push_error: string | null; has_push_token: boolean }> {
    return apiRequest(API_NOTIFICATIONS_TEST, { method: 'POST', body: JSON.stringify({}) });
  },
};
