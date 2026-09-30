import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/design';
import { WritingPrompt } from './WritingPromptCard';

interface Props {
  prompt: WritingPrompt;
  onSubmit: (content: string) => void;
  loading?: boolean;
}

export default function WritingEditor({ prompt, onSubmit, loading }: Props) {
  const [content, setContent] = useState('');
  const [currentWordCount, setCurrentWordCount] = useState(0);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    setCurrentWordCount(words.length);
  }, [content]);

  const targetMet = prompt.wordCount ? currentWordCount >= prompt.wordCount : true;

  return (
    <View style={styles.container}>
      <View style={styles.promptCard}>
        <Text style={styles.promptTitle}>{prompt.title}</Text>
        <Text style={styles.promptDescription}>{prompt.description}</Text>
      </View>
      
      <View style={styles.editorContainer}>
        <TextInput
          style={styles.input}
          multiline
          placeholder="Bắt đầu viết tại đây..."
          placeholderTextColor={Colors.onSurfaceVariant}
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
        />
        <View style={styles.footer}>
          <Text style={[styles.wordCount, { color: targetMet ? Colors.primary : Colors.onSurfaceVariant }]}>
            {currentWordCount} {prompt.wordCount ? `/ ${prompt.wordCount}` : ''} từ
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, (!content.trim() || loading) && styles.submitButtonDisabled]}
        onPress={() => onSubmit(content)}
        disabled={!content.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Nộp bài</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 8,
  },
  promptDescription: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    padding: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.onSurface,
    minHeight: 200,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
  },
  wordCount: {
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});
