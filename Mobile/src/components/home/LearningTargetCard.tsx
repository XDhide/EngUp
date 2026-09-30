import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { ProgressBar } from '../common/ProgressBar';

interface LearningTargetCardProps {
  currentMinutes?: number;
  targetMinutes?: number;
}

export const LearningTargetCard: React.FC<LearningTargetCardProps> = ({
  currentMinutes = 15,
  targetMinutes = 30,
}) => {
  const percent = targetMinutes > 0 ? Math.round((currentMinutes / targetMinutes) * 100) : 0;
  const progressRatio = targetMinutes > 0 ? currentMinutes / targetMinutes : 0;
  const remainingMinutes = Math.max(0, targetMinutes - currentMinutes);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          Mục tiêu hôm nay: {currentMinutes}/{targetMinutes} phút
        </Text>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>

      <ProgressBar progress={progressRatio} height={8} />

      <Text style={styles.subtext}>
        {remainingMinutes === 0
          ? 'Chúc mừng! Bạn đã hoàn thành mục tiêu thời gian hôm nay'
          : `Còn ${remainingMinutes} phút để hoàn thành mục tiêu ngày`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.4)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  },
  percentText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  subtext: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
});
