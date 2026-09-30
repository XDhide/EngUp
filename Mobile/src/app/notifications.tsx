import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import {
  notificationService,
  NotificationSettings,
  AppNotification,
} from '../services/notificationService';
import { errorMessage } from '../services/apiClient';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function NotificationsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [timeInput, setTimeInput] = useState('');
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const [s, n] = await Promise.allSettled([
      notificationService.getSettings(),
      notificationService.getNotifications(),
    ]);
    if (s.status === 'fulfilled') {
      setSettings(s.value);
      setTimeInput(s.value.daily_reminder_time ?? '');
    }
    if (n.status === 'fulfilled') setItems(n.value);
    const failed = [s, n].find((r) => r.status === 'rejected');
    setError(failed && failed.status === 'rejected' ? errorMessage(failed.reason, 'Không tải được thông báo.') : null);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const timeValid = timeInput.trim() === '' || TIME_REGEX.test(timeInput.trim());

  const save = async (patch: Partial<NotificationSettings>) => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const next = await notificationService.updateSettings(patch);
      setSettings(next);
      setTimeInput(next.daily_reminder_time ?? '');
      setSaved(true);
    } catch (e) {
      setError(errorMessage(e, 'Không lưu được cài đặt.'));
    } finally {
      setSaving(false);
    }
  };

  const markRead = async (n: AppNotification) => {
    if (n.is_read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    try {
      await notificationService.markAsRead(n.id);
    } catch (e) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: false } : x)));
      setError(errorMessage(e));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Thông báo" showBack onBack={() => router.back()} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {error && <ErrorBanner message={error} />}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>NHẮC HỌC</Text>

              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text style={styles.rowTitle}>Nhắc ôn từ đến hạn</Text>
                  <Text style={styles.rowDesc}>Gửi thông báo khi có từ cần ôn theo lịch SRS.</Text>
                </View>
                <Switch
                  value={settings?.review_reminder_enabled ?? false}
                  disabled={saving || !settings}
                  onValueChange={(v) => save({ review_reminder_enabled: v })}
                  trackColor={{ true: Colors.primaryContainer, false: Colors.surfaceContainerHigh }}
                  thumbColor={Colors.surfaceContainerLowest}
                />
              </View>

              <AppInput
                label="Giờ nhắc học mỗi ngày (HH:mm)"
                placeholder="Ví dụ 20:30 — để trống để tắt"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                value={timeInput}
                onChangeText={(t) => {
                  setTimeInput(t);
                  setSaved(false);
                }}
                error={timeValid ? null : 'Giờ không hợp lệ, dùng định dạng HH:mm (24 giờ).'}
              />
              <AppButton
                title="Lưu giờ nhắc"
                loading={saving}
                disabled={!timeValid || (timeInput.trim() || null) === (settings?.daily_reminder_time ?? null)}
                onPress={() => save({ daily_reminder_time: timeInput.trim() === '' ? null : timeInput.trim() })}
              />
              {saved && <Text style={styles.savedText}>Đã lưu cài đặt.</Text>}
            </View>

            <Text style={styles.sectionTitle}>LỊCH SỬ THÔNG BÁO</Text>
            {items.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.rowTitle}>Chưa có thông báo nào</Text>
                <Text style={styles.rowDesc}>Các nhắc nhở học tập sẽ xuất hiện tại đây.</Text>
              </View>
            ) : (
              items.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.item, !n.is_read && styles.itemUnread]}
                  onPress={() => markRead(n)}
                  activeOpacity={0.8}
                >
                  <View style={styles.itemHead}>
                    <Text style={styles.rowTitle}>{n.title || 'Thông báo'}</Text>
                    {!n.is_read && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>Mới</Text>
                      </View>
                    )}
                  </View>
                  {!!(n.body || n.message) && <Text style={styles.rowDesc}>{n.body || n.message}</Text>}
                  <Text style={styles.date}>{new Date(n.created_at).toLocaleString('vi-VN')}</Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingHorizontal: Spacing.margin, paddingVertical: Spacing.md, gap: Spacing.md },
  loader: { marginVertical: Spacing.xl },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.xl, padding: Spacing.md, gap: Spacing.md },
  sectionTitle: { ...Typography.labelSm, color: Colors.outline, fontWeight: '700', letterSpacing: 0.5 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  switchText: { flex: 1, gap: 2 },
  rowTitle: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '700' },
  rowDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  savedText: { ...Typography.labelMd, color: Colors.primary, fontWeight: '600' },
  empty: { padding: Spacing.lg, alignItems: 'center', gap: 4 },
  item: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.lg,
    padding: Spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  itemUnread: { backgroundColor: Colors.secondaryContainer, borderColor: Colors.primaryContainer },
  itemHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  newBadge: { backgroundColor: Colors.primaryContainer, borderRadius: Rounded.full, paddingHorizontal: 8, paddingVertical: 2 },
  newBadgeText: { ...Typography.labelSm, color: Colors.onPrimaryContainer, fontWeight: '800' },
  date: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  bottomSpacer: { height: Spacing.xl },
});
