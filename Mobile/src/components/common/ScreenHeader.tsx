import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/design';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack, rightElement }) => {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      <View style={styles.right}>
        {rightElement}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
  },
  center: {
    flex: 2,
    alignItems: 'center',
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: Spacing.xs,
  },
  backText: {
    ...Typography.labelMd,
    textTransform: 'uppercase',
    color: Colors.onSurface,
  },
  title: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  }
});
