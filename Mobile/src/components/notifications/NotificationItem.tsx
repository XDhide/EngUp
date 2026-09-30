import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/design';
import { AppNotification } from '@/services/notifications.service';

interface Props {
  notification: AppNotification;
  onRead: (id: string) => void;
  onActionPress?: (url: string) => void;
}

export const NotificationItem: React.FC<Props> = ({ notification, onRead, onActionPress }) => {
  const isUnread = notification.status === 'unread';

  return (
    <TouchableOpacity 
      style={[styles.container, isUnread ? styles.unreadContainer : styles.readContainer]}
      onPress={() => onRead(notification.id)}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={styles.leftMeta}>
          {isUnread ? (
            <View style={styles.badgeUnread}>
              <Text style={styles.badgeTextUnread}>Mới</Text>
            </View>
          ) : (
             <View style={styles.badgeRead}>
              <Text style={styles.badgeTextRead}>Đã đọc</Text>
            </View>
          )}
          <Text style={styles.typeLabel}>{notification.type.toUpperCase()}</Text>
        </View>
        <Text style={styles.timestamp}>{new Date(notification.createdAt).toLocaleDateString()}</Text>
      </View>

      <Text style={styles.title}>{notification.title}</Text>
      <Text style={styles.body}>{notification.body}</Text>

      {notification.actionUrl && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onActionPress?.(notification.actionUrl!)}
        >
          <Text style={styles.actionText}>Xem kết quả →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unreadContainer: {
    backgroundColor: Colors.secondaryContainer,
  },
  readContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeUnread: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginRight: Spacing.sm,
  },
  badgeRead: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginRight: Spacing.sm,
  },
  badgeTextUnread: {
    ...Typography.labelSm,
    color: Colors.onError,
  },
  badgeTextRead: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  typeLabel: {
    ...Typography.labelMd,
    color: Colors.primary,
    letterSpacing: 1,
  },
  timestamp: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  title: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  body: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  actionText: {
    ...Typography.labelMd,
    color: Colors.primary,
  },
});

