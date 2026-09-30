import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/design';
import { WritingSubmission } from './WritingFeedback';

interface Props {
  submission: WritingSubmission;
  onView: () => void;
}

export default function SubmissionHistoryItem({ submission, onView }: Props) {
  const wordCount = submission.content.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{submission.score ? submission.score.toFixed(1) : '-'}</Text>
        </View>
        <Text style={styles.dateText}>{new Date(submission.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.title} numberOfLines={1}>Bài viết #{submission.id.substring(0,6)}</Text>
      <Text style={styles.metaText}>{wordCount} từ</Text>
      
      <TouchableOpacity style={styles.button} onPress={onView}>
        <Text style={styles.buttonText}>Xem chi tiết</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreBadge: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  dateText: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    marginBottom: 12,
  },
  button: {
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  }
});
