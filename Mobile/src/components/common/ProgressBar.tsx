import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Rounded } from '../../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  trackColor?: string;
  fillColor?: string;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 6,
  trackColor = Colors.secondaryContainer,
  fillColor = Colors.primaryContainer,
  style,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: fillColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: Rounded.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Rounded.full,
  },
});
