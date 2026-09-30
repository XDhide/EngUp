import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Rounded } from '../../constants/theme';

export type BadgeVariant = 'primary' | 'secondary' | 'surface' | 'tertiary' | 'outline';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'secondary',
  style,
  textStyle,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: Colors.primaryContainer };
      case 'secondary':
        return { backgroundColor: Colors.secondaryContainer };
      case 'surface':
        return { backgroundColor: Colors.surfaceContainerHighest };
      case 'tertiary':
        return { backgroundColor: Colors.tertiaryFixed };
      case 'outline':
        return {
          backgroundColor: Colors.surfaceContainerLowest,
          borderWidth: 1,
          borderColor: Colors.secondaryFixed,
        };
    }
  };

  const getLabelStyle = () => {
    switch (variant) {
      case 'primary':
        return { color: Colors.onPrimary };
      case 'secondary':
        return { color: Colors.onSecondaryContainer };
      case 'surface':
        return { color: Colors.onSurfaceVariant };
      case 'tertiary':
        return { color: Colors.onTertiaryFixed };
      case 'outline':
        return { color: Colors.onSurface };
    }
  };

  return (
    <View style={[styles.badge, getContainerStyle(), style]}>
      <Text style={[styles.label, getLabelStyle(), textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Rounded.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.labelSm,
    fontWeight: '600',
  },
});
