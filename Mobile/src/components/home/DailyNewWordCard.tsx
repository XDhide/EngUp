import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { ProgressBar } from '../common/ProgressBar';

interface DailyNewWordCardProps {
  currentCount: number;
  targetLimit: number;
  onPress: () => void;
}

export const DailyNewWordCard: React.FC<DailyNewWordCardProps> = ({
  currentCount = 5,
  targetLimit = 10,
  onPress,
}) => {
  const percent = targetLimit > 0 ? Math.round((currentCount / targetLimit) * 100) : 0;
  const progressRatio = targetLimit > 0 ? currentCount / targetLimit : 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          Từ mới hôm nay: {currentCount}/{targetLimit}
        </Text>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>

      <Text style={styles.subtext}>
        {percent >= 100
          ? 'Đã hoàn thành chỉ tiêu từ mới hôm nay!'
          : `Đã đạt ${percent}% chỉ tiêu hàng ngày`}
      </Text>

      <ProgressBar progress={progressRatio} height={8} />

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Học từ mới</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(202, 234, 214, 0.5)',
    borderRadius: Rounded.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
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
  actionBtn: {
    height: 44,
    borderRadius: Rounded.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  btnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
});
