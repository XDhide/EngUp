import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/design';

export type WritingPrompt = {
  id: string;
  title: string;
  description: string;
  type: 'email' | 'essay' | 'paragraph';
  difficulty: string;
  wordCount?: number;
};

interface Props {
  prompt: WritingPrompt;
  onStart: () => void;
}

export default function WritingPromptCard({ prompt, onStart }: Props) {
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'email': return 'Email';
      case 'essay': return 'Essay';
      case 'paragraph': return 'Đoạn văn';
      default: return type;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{getTypeLabel(prompt.type)}</Text>
        </View>
        <View style={[styles.chip, styles.difficultyChip]}>
          <Text style={styles.difficultyText}>{prompt.difficulty}</Text>
        </View>
      </View>
      <Text style={styles.title}>{prompt.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{prompt.description}</Text>
      {prompt.wordCount && (
        <Text style={styles.wordCount}>Yêu cầu: ~{prompt.wordCount} từ</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>Bắt đầu viết</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  chipText: {
    color: Colors.onSurface,
    fontSize: 12,
    fontWeight: '500',
  },
  difficultyChip: {
    backgroundColor: Colors.secondaryContainer,
  },
  difficultyText: {
    color: Colors.onSecondaryFixed,
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 12,
  },
  wordCount: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  }
});
