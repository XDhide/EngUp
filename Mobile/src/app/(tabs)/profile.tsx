import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from '../../components/common/AppHeader';
import { statsService, StatsOverview } from '../../services/statsService';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [stats, setStats] = useState<StatsOverview | null>(null);

  // Làm mới hồ sơ + thống kê mỗi khi mở tab (ví dụ vừa làm placement test xong).
  useFocusEffect(
    useCallback(() => {
      refreshUser();
      statsService.getOverview().then(setStats).catch(() => {});
    }, [refreshUser])
  );

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Cá Nhân" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'EU'}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.full_name || 'Học viên EngUp'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>
                Trình độ: {user?.level_current ? user.level_current.toUpperCase() : 'Chưa xác định'}
              </Text>
            </View>
          </View>
        </View>

        {/* Learning Statistics Overview */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>THỐNG KÊ HỌC TẬP</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats?.current_streak ?? 0}</Text>
              <Text style={styles.statLabel}>Ngày liên tiếp</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats?.total_words_learned ?? 0}</Text>
              <Text style={styles.statLabel}>Từ đã thuộc</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats?.total_reviews ?? 0}</Text>
              <Text style={styles.statLabel}>Lượt ôn tập</Text>
            </View>
          </View>
        </View>

        {/* Feature Navigation Links */}
        <View style={styles.menuGroup}>
          <Text style={styles.sectionTitle}>CÀI ĐẶT & TÍNH NĂNG</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/placement-test')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuItemText}>Kiểm tra lại trình độ (Placement Test)</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/daily-words')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuItemText}>Điều chỉnh chỉ tiêu từ mới mỗi ngày</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/notebook')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuItemText}>Sổ tay ghi chú từ vựng</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/notes')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuItemText}>Ghi chú của tôi</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/contribute')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuItemText}>Đóng góp từ vựng, bài học, câu hỏi</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuItemText}>Thông báo & nhắc học</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/notification-settings')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuItemText}>Cài đặt thông báo</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    paddingHorizontal: Spacing.margin,
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  profileCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    ...Typography.headlineMd,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  userEmail: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  levelBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Rounded.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  levelBadgeText: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  sectionTitle: {
    ...Typography.labelSm,
    color: Colors.outline,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    ...Typography.headlineLg,
    color: Colors.primary,
    fontWeight: '800',
  },
  statLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  menuGroup: {
    gap: Spacing.sm,
  },
  menuItem: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.4)',
  },
  menuItemText: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  menuItemArrow: {
    ...Typography.titleSm,
    color: Colors.outline,
  },
  logoutBtn: {
    height: 48,
    borderRadius: Rounded.md,
    backgroundColor: Colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  logoutBtnText: {
    ...Typography.labelMd,
    color: Colors.onErrorContainer,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
