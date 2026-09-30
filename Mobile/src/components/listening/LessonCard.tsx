import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';
import { ListeningLesson } from '@/services/listening.service';

interface Props {
  lesson: ListeningLesson;
  onPress: () => void;
}

export const LessonCard: React.FC<Props> = ({ lesson, onPress }) => {
  const isCompleted = !!lesson.completedAt;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#22C55E';
      case 'medium': return '#EAB308';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Dễ';
      case 'medium': return 'Vừa';
      case 'hard': return 'Khó';
      default: return difficulty;
    }
  };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: getDifficultyColor(lesson.difficulty) + '20' }]}>
            <Text style={[styles.badgeText, { color: getDifficultyColor(lesson.difficulty) }]}>
              {getDifficultyText(lesson.difficulty)}
            </Text>
          </View>
          <View style={styles.topicBadge}>
            <Text style={styles.topicText}>{lesson.topic}</Text>
          </View>
        </View>
        <Text style={styles.duration}>{Math.floor(lesson.durationSeconds / 60)}:{(lesson.durationSeconds % 60).toString().padStart(2, '0')}</Text>
      </View>

      <Text style={styles.title} numberOfLines={1}>{lesson.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{lesson.description}</Text>

      <View style={styles.footer}>
        <Text style={styles.stats}>{lesson.wordCount} từ</Text>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>{lesson.accuracy}% chính xác</Text>
          </View>
        )}
      </View>

      <View style={styles.actionContainer}>
        <Pressable style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>{isCompleted ? 'Luyện lại' : 'Bắt đầu'}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primaryContainer,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.md,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  topicBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.md,
    backgroundColor: '#F3F4F6',
  },
  topicText: {
    fontSize: 12,
    color: '#4B5563',
  },
  duration: {
    fontSize: 12,
    color: '#6B7280',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stats: {
    fontSize: 12,
    color: '#6B7280',
  },
  completedBadge: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.md,
  },
  completedText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  button: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  buttonText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
