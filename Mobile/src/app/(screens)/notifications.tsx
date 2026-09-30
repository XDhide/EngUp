import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/design';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { getNotifications, markAsRead, AppNotification } from '@/services/notifications.service';

export default function NotificationsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications({ status: tab === 'unread' ? 'unread' : 'all' });
      setNotifications(res.notifications || []);
      if (tab === 'all') {
        setUnreadCount((res.notifications || []).filter(n => n.status === 'unread').length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchNotifications();
  }, [tab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
      if (unreadCount > 0) setUnreadCount(c => c - 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => n.status === 'unread').map(n => n.id);
    for (const id of unreadIds) {
      await handleRead(id);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.headerAction}>Đánh dấu tất cả</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, tab === 'all' && styles.activeTab]}
          onPress={() => setTab('all')}
        >
          <Text style={[styles.tabText, tab === 'all' && styles.activeTabText]}>Tất cả</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, tab === 'unread' && styles.activeTab]}
          onPress={() => setTab('unread')}
        >
          <Text style={[styles.tabText, tab === 'unread' && styles.activeTabText]}>
            Chưa đọc {unreadCount > 0 ? `(${unreadCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <NotificationItem 
              notification={item} 
              onRead={handleRead}
              onActionPress={(url) => console.log('Navigate to:', url)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Đã xem hết — không còn thông báo mới</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.settingsLink}
        onPress={() => router.push('/notification-settings')}
      >
        <Text style={styles.settingsLinkText}>Cài đặt thông báo</Text>
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  headerTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
  },
  headerAction: {
    ...Typography.labelMd,
    color: Colors.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  listContent: {
    padding: Spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  settingsLink: {
    padding: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  settingsLinkText: {
    ...Typography.labelMd,
    color: Colors.primary,
  },
});

