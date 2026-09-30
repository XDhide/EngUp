import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/design/Colors';
import { Typography } from '@/constants/design/Typography';
import { Spacing } from '@/constants/design/Spacing';
import { Radius } from '@/constants/design/Radius';

interface Skill {
  skill: string;
  percent: number;
  done: number;
  total: number;
}

interface SkillProgressListProps {
  skills: Skill[];
}

export const SkillProgressList: React.FC<SkillProgressListProps> = ({ skills }) => {
  return (
    <View style={styles.container}>
      {skills.map((item, index) => (
        <View key={index} style={styles.skillItem}>
          <View style={styles.headerRow}>
            <Text style={styles.skillName}>{item.skill}</Text>
            <Text style={styles.statsLabel}>
              {item.percent}% — {item.done}/{item.total} bài
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${Math.min(item.percent, 100)}%` }
              ]} 
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  skillItem: {
    marginBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  skillName: {
    ...Typography.bodyMedium,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  statsLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.full,
  },
});
