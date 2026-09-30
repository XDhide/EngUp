import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/design';

interface StreakBadgeProps {
  streak: number;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{streak} ngày liên tiếp</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: 'bold',
  },
});

