import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/design/Colors';
import { Typography } from '@/constants/design/Typography';
import { Spacing } from '@/constants/design/Spacing';
import { Radius } from '@/constants/design/Radius';

interface InsightCardProps {
  ranking?: string;
  comment: string;
  goalPercent: number;
}

export const InsightCard: React.FC<InsightCardProps> = ({ ranking, comment, goalPercent }) => {
  return (
    <View style={styles.container}>
      <View style={styles.goalRow}>
        <Text style={styles.goalTitle}>Mục tiêu tuần</Text>
        <Text style={styles.goalValue}>{goalPercent}% hoàn thành</Text>
      </View>
      <View style={styles.goalProgressBarBg}>
        <View style={[styles.goalProgressBarFill, { width: `${Math.min(goalPercent, 100)}%` }]} />
      </View>
      
      <View style={styles.insightContent}>
        {ranking && (
          <View style={styles.rankingBadge}>
            <Text style={styles.rankingText}>{ranking}</Text>
          </View>
        )}
        <Text style={styles.comment}>{comment}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondaryContainer,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  goalTitle: {
    ...Typography.titleSmall,
    color: Colors.onSecondaryContainer,
  },
  goalValue: {
    ...Typography.labelMedium,
    color: Colors.onSecondaryContainer,
    fontWeight: 'bold',
  },
  goalProgressBarBg: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  goalProgressBarFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: Radius.full,
  },
  insightContent: {
    gap: Spacing.sm,
  },
  rankingBadge: {
    backgroundColor: Colors.secondary,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  rankingText: {
    ...Typography.labelSmall,
    color: Colors.onSecondary,
    fontWeight: 'bold',
  },
  comment: {
    ...Typography.bodyMedium,
    color: Colors.onSecondaryContainer,
  },
});
