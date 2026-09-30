import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Rounded, Spacing } from '../../constants/theme';

interface ErrorBannerProps {
  message: string;
  style?: ViewStyle;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, style }) => {
  if (!message) return null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.errorContainer,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  text: {
    ...Typography.labelSm,
    color: Colors.onErrorContainer,
    lineHeight: 18,
  },
});
