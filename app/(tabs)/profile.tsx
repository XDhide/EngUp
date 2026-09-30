import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';
import { getMe, logout } from '@/services/auth.service';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getMe();
      setUser(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.name || 'User')}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'User Name'}</Text>
        <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
        
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>Học viên năng động - 7 ngày liên tiếp</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lộ trình học tập</Text>
        
        <View style={styles.card}>
          <View>
            <Text style={styles.cardLabel}>Trình độ hiện tại</Text>
            <Text style={styles.cardValue}>B1 Trung cấp</Text>
          </View>
          <Pressable><Text style={styles.cardAction}>Làm lại bài test xếp lớp</Text></Pressable>
        </View>

        <View style={styles.card}>
          <View>
            <Text style={styles.cardLabel}>Mục tiêu học tập</Text>
            <Text style={styles.cardValue}>IELTS 6.5</Text>
          </View>
          <Pressable><Text style={styles.cardAction}>Sửa</Text></Pressable>
        </View>

        <View style={styles.card}>
          <View>
            <Text style={styles.cardLabel}>Thời gian học mỗi ngày</Text>
            <Text style={styles.cardValue}>30 phút</Text>
          </View>
          <Pressable><Text style={styles.cardAction}>Sửa</Text></Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt & Tùy chọn</Text>
        <Pressable style={styles.settingRow}>
          <Text style={styles.settingText}>Thông báo</Text>
        </Pressable>
        <Pressable style={styles.settingRow}>
          <Text style={styles.settingText}>Từ vựng mới mỗi ngày</Text>
        </Pressable>
        <Pressable style={styles.settingRow}>
          <Text style={styles.settingText}>Dữ liệu & Đồng bộ</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>
      
      <Text style={styles.version}>EngUp v2.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  name: {
    fontSize: 24, // headline-md
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  email: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.md,
  },
  streakBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  streakText: {
    color: Colors.onSecondaryFixed,
    fontWeight: '500',
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  cardAction: {
    color: Colors.primary,
    fontWeight: '500',
  },
  settingRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerLowest,
  },
  settingText: {
    fontSize: 16,
    color: Colors.onSurface,
  },
  logoutButton: {
    margin: Spacing.md,
    backgroundColor: Colors.errorContainer,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.error,
    fontWeight: 'bold',
    fontSize: 16,
  },
  version: {
    textAlign: 'center',
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xl,
  },
});
