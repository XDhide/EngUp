import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';

type ReadingArticle = { id: string; title: string; content: string; difficulty: string; topic: string; questions: any[]; vocabularies: any[] };

interface ArticleCardProps {
  article: ReadingArticle;
  onPress: () => void;
  completed?: boolean;
  bandScore?: number;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onPress, completed, bandScore }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{article.topic}</Text>
          </View>
          <View style={[styles.badge, styles.difficultyBadge]}>
            <Text style={styles.difficultyText}>{article.difficulty}</Text>
          </View>
        </View>
        {completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Đã làm</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
      
      <View style={styles.meta}>
        <Text style={styles.metaText}>{article.questions?.length || 0} câu hỏi</Text>
        {completed && bandScore && (
          <Text style={styles.scoreText}>Band: {bandScore}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{completed ? 'Làm lại' : 'Bắt đầu'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
    gap: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  difficultyBadge: {
    backgroundColor: Colors.secondaryContainer,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  difficultyText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  completedText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  metaText: {
    color: Colors.onSurfaceVariant,
    fontSize: 14,
  },
  scoreText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
