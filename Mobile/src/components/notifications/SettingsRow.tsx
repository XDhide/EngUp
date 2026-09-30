import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/design';

interface Props {
  title: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  timeLabel?: string;
  onTimePress?: () => void;
}

export const SettingsRow: React.FC<Props> = ({ 
  title, 
  description, 
  value, 
  onChange,
  timeLabel,
  onTimePress
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
          thumbColor={Colors.onPrimary}
        />
      </View>
      {timeLabel && (
        <TouchableOpacity style={styles.timeButton} onPress={onTimePress}>
          <Text style={styles.timeLabelText}>Thời gian: {timeLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  title: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  },
  description: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  timeButton: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  timeLabelText: {
    ...Typography.labelMd,
    color: Colors.onSecondaryContainer,
  },
});

