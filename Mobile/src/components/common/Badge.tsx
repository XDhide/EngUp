import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/design';

type BadgeColor = 'primary' | 'secondary' | 'error' | 'neutral' | 'tertiary';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
}

export const Badge: React.FC<BadgeProps> = ({ label, color = 'neutral' }) => {
  const getTheme = () => {
    switch (color) {
      case 'primary':
        return { bg: Colors.primaryContainer, text: Colors.primary };
      case 'secondary':
        return { bg: Colors.secondaryContainer, text: Colors.onSecondaryFixed };
      case 'error':
        return { bg: Colors.errorContainer, text: Colors.error };
      case 'tertiary':
        return { bg: Colors.tertiaryContainer, text: Colors.tertiary };
      case 'neutral':
      default:
        return { bg: Colors.surfaceContainerHigh, text: Colors.onSurface };
    }
  };

  const theme = getTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.labelSm,
  },
});
