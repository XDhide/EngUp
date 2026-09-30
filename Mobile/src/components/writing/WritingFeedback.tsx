import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/design';

export type WritingSubmission = {
  id: string;
  promptId: string;
  content: string;
  score?: number;
  feedback?: {
    grammar: string[];
    vocabulary: string[];
    suggestions: string[];
  };
  createdAt: string;
};

interface Props {
  submission: WritingSubmission;
  onRetry: () => void;
  onSave: () => void;
}

export default function WritingFeedback({ submission, onRetry, onSave }: Props) {
  const { score, feedback } = submission;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {score !== undefined && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Điểm: {score.toFixed(1)}</Text>
          </View>
        )}

        {feedback?.grammar && feedback.grammar.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lỗi Ngữ pháp</Text>
            {feedback.grammar.map((item, index) => (
              <View key={index} style={[styles.issueRow, styles.grammarRow]}>
                <Text style={styles.issueText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {feedback?.vocabulary && feedback.vocabulary.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gợi ý Từ vựng</Text>
            {feedback.vocabulary.map((item, index) => (
              <View key={index} style={[styles.issueRow, styles.vocabRow]}>
                <Text style={styles.issueText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {feedback?.suggestions && feedback.suggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cách nâng cấp bài viết</Text>
            {feedback.suggestions.map((item, index) => (
              <View key={index} style={styles.suggestionRow}>
                <Text style={styles.issueText}>• {item}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onRetry}>
          <Text style={styles.secondaryButtonText}>Viết lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={onSave}>
          <Text style={styles.primaryButtonText}>Lưu vào sổ tay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    padding: 16,
  },
  scoreContainer: {
    backgroundColor: Colors.primaryContainer,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 24,
  },
  scoreText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 12,
  },
  issueRow: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  grammarRow: {
    backgroundColor: Colors.errorContainer,
  },
  vocabRow: {
    backgroundColor: Colors.primaryContainer,
  },
  suggestionRow: {
    paddingVertical: 4,
  },
  issueText: {
    color: Colors.onSurface,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  }
});
