import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Rounded, Spacing } from '../../constants/theme';

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  style?: ViewStyle;
  count?: number;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isActive,
  onPress,
  style,
  count,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        isActive ? styles.chipActive : styles.chipInactive,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          isActive ? styles.labelActive : styles.labelInactive,
        ]}
      >
        {label} {count !== undefined ? `(${count})` : ''}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Rounded.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primaryContainer,
  },
  chipInactive: {
    backgroundColor: Colors.secondaryContainer,
  },
  label: {
    ...Typography.labelMd,
    fontSize: 13,
  },
  labelActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  labelInactive: {
    color: Colors.onSecondaryContainer,
    fontWeight: '500',
  },
});
