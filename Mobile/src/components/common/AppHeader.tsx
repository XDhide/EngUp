import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  backLabel?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  subtitle?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack = false,
  backLabel = 'Quay lại',
  onBack,
  rightAction,
  subtitle,
}) => {
  const router = useRouter();
  const { user } = useAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const getInitials = () => {
    if (user?.full_name) {
      const parts = user.full_name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return user.full_name.slice(0, 2).toUpperCase();
    }
    return 'EU';
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backText}>{backLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.brandGroup}>
            <Text style={styles.brandText}>EngUp</Text>
            {subtitle && (
              <>
                <Text style={styles.divider}>/</Text>
                <Text style={styles.subtitleText}>{subtitle}</Text>
              </>
            )}
          </View>
        )}
      </View>

      {title && showBack && (
        <View style={styles.center}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}

      <View style={styles.right}>
        {rightAction ? (
          rightAction
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    paddingHorizontal: Spacing.margin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(248, 249, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 227, 246, 0.6)',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  center: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: {
    ...Typography.labelMd,
    color: Colors.primary,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    ...Typography.headlineMd,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  divider: {
    ...Typography.bodyMd,
    color: Colors.outlineVariant,
  },
  subtitleText: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  },
  titleText: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.labelSm,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
});
