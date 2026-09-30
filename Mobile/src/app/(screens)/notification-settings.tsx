import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/design';
import { SettingsRow } from '@/components/notifications/SettingsRow';
import { getSettings, updateSettings, NotificationSettings } from '@/services/notifications.service';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getSettings();
        setSettings(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key: keyof NotificationSettings, value: boolean | string) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSettings(settings);
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt thông báo</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch nhắc học</Text>
          <SettingsRow
            title="Nhắc nhở học tập"
            description="Nhận thông báo để duy trì thói quen học tập."
            value={settings.studyReminder}
            onChange={(v) => handleChange('studyReminder', v)}
            timeLabel={settings.reminderTime}
            onTimePress={() => console.log('Open time picker')}
          />
          <SettingsRow
            title="Ôn tập từ vựng"
            description="Nhắc nhở ôn lại các từ vựng mới học hôm qua."
            value={settings.dailyVocab}
            onChange={(v) => handleChange('dailyVocab', v)}
            timeLabel={settings.dailyVocabTime}
            onTimePress={() => console.log('Open time picker')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nội dung & Tính năng mới</Text>
          <SettingsRow
            title="AI Phản hồi"
            description="Thông báo khi AI đã chấm bài và có kết quả đánh giá."
            value={settings.aiFeedback}
            onChange={(v) => handleChange('aiFeedback', v)}
          />
          <SettingsRow
            title="Báo cáo tuần"
            description="Tóm tắt tiến độ học tập và thành tích mỗi tuần."
            value={settings.weeklyReport}
            onChange={(v) => handleChange('weeklyReport', v)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kênh nhận thông báo</Text>
          <SettingsRow
            title="Thông báo đẩy (Push)"
            description="Hiển thị trực tiếp trên màn hình thiết bị."
            value={settings.pushEnabled}
            onChange={(v) => handleChange('pushEnabled', v)}
          />
          <SettingsRow
            title="Qua Email"
            description="Nhận thông báo quan trọng qua địa chỉ email đăng ký."
            value={settings.emailEnabled}
            onChange={(v) => handleChange('emailEnabled', v)}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.onPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Lưu ý: Để nhận thông báo đẩy, bạn cũng cần cấp quyền thông báo cho ứng dụng trong cài đặt thiết bị.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  backButton: {
    padding: Spacing.xs,
    width: 40,
  },
  backText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  headerTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  },
  content: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.titleSm,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  saveButtonText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
  },
  footerNote: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
