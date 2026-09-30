import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/design';

export type TestSet = {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  questionCount: number;
  duration: number;
};

export type TestAttempt = {
  id: string;
  testId: string;
  testTitle: string;
  bandScore?: number;
  score?: number;
  total: number;
  timeSpent: number;
  createdAt: string;
};

interface Props {
  test: TestSet;
  attempt?: TestAttempt;
  onPress: () => void;
}

export default function TestSetCard({ test, attempt, onPress }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{test.title}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{test.type}</Text>
        </View>
      </View>
      
      <Text style={styles.metaText}>
        Thời gian: {test.duration} phút — {test.questionCount} câu hỏi
      </Text>

      <View style={styles.footer}>
        {attempt ? (
          <View style={styles.attemptInfo}>
            {attempt.bandScore !== undefined && (
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>Band: {attempt.bandScore}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.buttonSecondary} onPress={onPress}>
              <Text style={styles.buttonTextSecondary}>Làm lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.attemptInfo}>
            <Text style={styles.statusText}>Chưa làm</Text>
            <TouchableOpacity style={styles.buttonPrimary} onPress={onPress}>
              <Text style={styles.buttonTextPrimary}>Bắt đầu</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurface,
    marginRight: 12,
  },
  typeBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    color: Colors.onSecondaryFixed,
    fontSize: 12,
    fontWeight: '500',
  },
  metaText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    marginBottom: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
    paddingTop: 12,
  },
  attemptInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  scoreBadge: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonTextSecondary: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
