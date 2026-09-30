import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/design';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';

  const getContainerStyle = (): ViewStyle => {
    if (isPrimary) {
      return { backgroundColor: Colors.primary };
    }
    if (isSecondary) {
      return { backgroundColor: Colors.secondaryContainer };
    }
    if (isOutline) {
      return { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border };
    }
    return {};
  };

  const getTextColor = () => {
    if (isPrimary) return Colors.onPrimary;
    if (isSecondary) return Colors.onSecondaryFixed;
    if (isOutline) return Colors.onSurface;
    return Colors.onPrimary;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        getContainerStyle(),
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.label, { color: getTextColor() }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...Typography.labelMd,
    textAlign: 'center',
  },
});
