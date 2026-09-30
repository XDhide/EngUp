import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';

export interface Topic {
  id: string;
  name: string;
}

interface TopicChipProps {
  topic: Topic;
  selected?: boolean;
  onPress: () => void;
}

export const TopicChip: React.FC<TopicChipProps> = ({ topic, selected, onPress }) => {
  return (
    <Pressable
      style={[
        styles.chip,
        selected ? styles.selectedChip : styles.unselectedChip,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.label,
          selected ? styles.selectedLabel : styles.unselectedLabel,
        ]}
      >
        {topic.name}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
  },
  selectedChip: {
    backgroundColor: Colors.primary,
  },
  unselectedChip: {
    backgroundColor: Colors.surface, // Assuming surfaceContainerHigh maps to surface or similar
  },
  label: {
    fontSize: 12, // label-sm
    fontWeight: '500',
  },
  selectedLabel: {
    color: Colors.onPrimary,
  },
  unselectedLabel: {
    color: Colors.onSurface,
  },
});
