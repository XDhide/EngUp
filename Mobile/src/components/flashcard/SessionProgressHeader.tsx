import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { ProgressBar } from '../common/ProgressBar';

interface SessionProgressHeaderProps {
  currentIndex: number;
  totalCount: number;
  onExit: () => void;
  title?: string;
}

export const SessionProgressHeader: React.FC<SessionProgressHeaderProps> = ({
  currentIndex,
  totalCount,
  onExit,
  title = 'Tiến trình',
}) => {
  const progressRatio = totalCount > 0 ? currentIndex / totalCount : 0;

  return (
    <View style={styles.container}>
      <View style={styles.progressGroup}>
        <View style={styles.row}>
          <Text style={styles.title}>{title.toUpperCase()}</Text>
          <Text style={styles.countText}>
            {currentIndex}/{totalCount} từ
          </Text>
        </View>
        <ProgressBar progress={progressRatio} height={6} />
      </View>

      <TouchableOpacity onPress={onExit} style={styles.exitBtn} activeOpacity={0.7}>
        <Text style={styles.exitText}>Thoát</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    gap: Spacing.md,
  },
  progressGroup: {
    flex: 1,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countText: {
    ...Typography.labelSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  exitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  exitText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
});
