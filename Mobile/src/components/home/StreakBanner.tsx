import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';

interface StreakBannerProps {
  userName?: string;
  streakCount?: number;
}

export const StreakBanner: React.FC<StreakBannerProps> = ({
  userName = 'Học viên',
  streakCount = 7,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.greeting} numberOfLines={1}>
          Xin chào, {userName}
        </Text>
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>Streak: {streakCount} ngày</Text>
        </View>
      </View>
      <Text style={styles.subGreeting}>
        Sẵn sàng duy trì nhịp độ ghi nhớ cùng EngUp.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  greeting: {
    ...Typography.headlineLg,
    color: Colors.onSurface,
    flex: 1,
  },
  streakPill: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Rounded.full,
  },
  streakText: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  subGreeting: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
});
