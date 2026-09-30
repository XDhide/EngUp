import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/design/Colors';
import { Typography } from '@/constants/design/Typography';
import { Spacing } from '@/constants/design/Spacing';
import { Radius } from '@/constants/design/Radius';

export type DailyProgress = {
  date: string;
  day: string;
  minutes: number;
  percent: number; // 0 to 100
};

interface WeeklyBarChartProps {
  data: DailyProgress[];
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ data }) => {
  // Find max percent to scale, though percent is usually max 100
  const maxPercent = Math.max(...data.map(d => d.percent), 100);

  return (
    <View style={styles.container}>
      {data.map((item, index) => {
        const isActive = item.percent === Math.max(...data.map(d => d.percent)) && item.percent > 0;
        
        return (
          <View key={index} style={styles.barContainer}>
            <Text style={styles.valueLabel}>
              {item.minutes > 0 ? `${item.minutes}p` : ''}
            </Text>
            <View style={styles.barBackground}>
              <View 
                style={[
                  styles.barFill, 
                  { 
                    height: `${(item.percent / maxPercent) * 100}%`,
                    backgroundColor: isActive ? Colors.primary : Colors.primaryContainer
                  }
                ]} 
              />
            </View>
            <Text style={[styles.dayLabel, isActive && styles.activeDayLabel]}>
              {item.day}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  valueLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
    height: 16,
  },
  barBackground: {
    width: 24,
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: Radius.sm,
  },
  dayLabel: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.xs,
  },
  activeDayLabel: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
