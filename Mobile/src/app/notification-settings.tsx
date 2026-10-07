import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { notificationService, NotificationSettings } from '../services/notificationService';
import { errorMessage } from '../services/apiClient';
import { pushService } from '../services/pushService';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Chỉ hiển thị các cài đặt mà Backend thật hỗ trợ: bật nhắc ôn từ và giờ nhắc học mỗi ngày.
export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [timeInput, setTimeInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await notificationService.getSettings();
      setSettings(s);
      setTimeInput(s.daily_reminder_time ?? '');
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được cài đặt thông báo.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const enablePush = async () => {
    setPushBusy(true);
    setPushMsg(null);
    const r = await pushService.register();
    setPushMsg(r.message);
    await load();
    setPushBusy(false);
  };

  const sendTest = async () => {
    setPushBusy(true);
    setPushMsg(null);
    try {
      const r = await pushService.sendTest();
      if (r.push === 'sent') setPushMsg('Đã gửi thông báo thử. Nếu không thấy trên màn hình khóa, hãy kiểm tra quyền thông báo của ứng dụng.');
      else if (r.push === 'no_token') setPushMsg('Thiết bị chưa đăng ký thông báo đẩy. Bấm "Bật thông báo đẩy" trước.');
      else setPushMsg(`Gửi push thất bại${r.push_error ? `: ${r.push_error}` : ''}.`);
    } catch (e) {
      setPushMsg(errorMessage(e, 'Không gửi được thông báo thử.'));
    }
    setPushBusy(false);
  };

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Cài đặt thông báo" showBack onBack={() => router.back()} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {error && <ErrorBanner message={error} />}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>LỊCH NHẮC HỌC</Text>
            <View style={styles.card}>
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

            <Text style={styles.sectionTitle}>THÔNG BÁO ĐẨY TRÊN THIẾT BỊ</Text>
            <View style={styles.card}>
              <Text style={styles.rowTitle}>
                {settings?.has_push_token ? 'Đã đăng ký nhận thông báo đẩy' : 'Chưa đăng ký nhận thông báo đẩy'}
              </Text>
              <Text style={styles.rowDesc}>
                Cần điện thoại thật và cấp quyền thông báo. Thông báo đẩy chỉ gửi khi bạn bật nhắc và đặt giờ nhắc ở trên.
              </Text>
              <AppButton title="Bật thông báo đẩy" loading={pushBusy} onPress={enablePush} />
              <AppButton title="Gửi thông báo thử" variant="outline" disabled={pushBusy} onPress={sendTest} />
              {pushMsg && <Text style={styles.savedText}>{pushMsg}</Text>}
            </View>
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
  sectionTitle: { ...Typography.labelSm, color: Colors.outline, fontWeight: '700', letterSpacing: 0.5 },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.xl, padding: Spacing.md, gap: Spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  switchText: { flex: 1, gap: 2 },
  rowTitle: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '700' },
  rowDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  savedText: { ...Typography.labelMd, color: Colors.primary, fontWeight: '600' },
  note: { ...Typography.labelSm, color: Colors.onSurfaceVariant, textAlign: 'center' },
  bottomSpacer: { height: Spacing.xl },
});
