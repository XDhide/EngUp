import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Rounded } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  size = 'md',
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'primary':
        return [
          styles.base,
          styles[size],
          { backgroundColor: Colors.primaryContainer },
          disabled && styles.disabled,
          style,
        ];
      case 'secondary':
        return [
          styles.base,
          styles[size],
          { backgroundColor: Colors.secondaryContainer },
          disabled && styles.disabled,
          style,
        ];
      case 'outline':
        return [
          styles.base,
          styles[size],
          {
            backgroundColor: Colors.surfaceContainerLowest,
            borderWidth: 1,
            borderColor: Colors.secondaryFixed,
          },
          disabled && styles.disabled,
          style,
        ];
      case 'danger':
        return [
          styles.base,
          styles[size],
          { backgroundColor: Colors.errorContainer },
          disabled && styles.disabled,
          style,
        ];
      case 'ghost':
        return [
          styles.base,
          styles[size],
          { backgroundColor: 'transparent' },
          disabled && styles.disabled,
          style,
        ];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.textBase, { color: Colors.onPrimary }, textStyle];
      case 'secondary':
        return [styles.textBase, { color: Colors.onSecondaryContainer }, textStyle];
      case 'outline':
        return [styles.textBase, { color: Colors.onSurface }, textStyle];
      case 'danger':
        return [styles.textBase, { color: Colors.onErrorContainer }, textStyle];
      case 'ghost':
        return [styles.textBase, { color: Colors.primary }, textStyle];
    }
  };

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.onPrimary : Colors.primary}
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sm: {
    height: 38,
    paddingHorizontal: 12,
  },
  md: {
    height: 48,
    paddingHorizontal: 16,
  },
  lg: {
    height: 52,
    paddingHorizontal: 20,
  },
  textBase: {
    ...Typography.labelMd,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
