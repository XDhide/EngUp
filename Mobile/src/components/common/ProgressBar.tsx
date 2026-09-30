import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/design';

interface ProgressBarProps {
  progress: number;
  label?: string;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  color = Colors.primary,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: color,
              width: animatedWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    height: 6,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  indicator: {
    height: '100%',
    borderRadius: Radius.full,
  },
  label: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
});
