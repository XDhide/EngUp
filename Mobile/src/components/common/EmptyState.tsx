import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/design';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {action && (
        <View style={styles.actionContainer}>
          <PrimaryButton label={action.label} onPress={action.onPress} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 300,
  }
});
