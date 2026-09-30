import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { ReadingArticleSummary } from '../../services/readingService';

interface ReadingArticleCardProps {
  article: ReadingArticleSummary;
  onPress: () => void;
  isFeatured?: boolean;
}

export const readingLevelLabel = (difficulty?: string | null): string => {
  switch (difficulty?.toUpperCase()) {
    case 'A1':
    case 'A2':
      return `Dễ (${difficulty?.toUpperCase()})`;
    case 'B1':
    case 'B2':
      return `Vừa (${difficulty?.toUpperCase()})`;
    case 'C1':
    case 'C2':
      return `Khó (${difficulty?.toUpperCase()})`;
    default:
      return difficulty || 'Chưa phân cấp';
  }
};

// Backend chỉ trả tiêu đề, chủ đề, cấp độ nên thẻ không bịa số phút đọc/tiến độ.
export const ReadingArticleCard: React.FC<ReadingArticleCardProps> = ({
  article,
  onPress,
  isFeatured = false,
}) => {
  return (
    <View style={[styles.card, isFeatured && styles.cardFeatured]}>
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          {!!article.topic && (
            <View style={styles.topicBadge}>
              <Text style={styles.topicText}>{article.topic}</Text>
            </View>
          )}
          <View style={styles.diffBadge}>
            <Text style={styles.diffText}>{readingLevelLabel(article.difficulty)}</Text>
          </View>
        </View>
        {article.is_ai_generated && (
          <View style={styles.progressPill}>
            <Text style={styles.progressPillText}>AI</Text>
          </View>
        )}
      </View>

      <View style={styles.contentGroup}>
        <Text style={styles.title} numberOfLines={3}>
          {article.title}
        </Text>
      </View>

      <View style={styles.footerSection}>
        <View style={styles.actionRow}>
          <Text style={styles.hintText}>Đọc bài và làm câu hỏi trắc nghiệm</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.85}>
            <Text style={styles.actionBtnText}>Bắt đầu đọc</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  cardFeatured: {
    borderColor: Colors.primaryContainer,
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topicBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.sm,
  },
  topicText: {
    ...Typography.labelSm,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  diffBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.sm,
  },
  diffText: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  progressPill: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.full,
  },
  progressPillText: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  contentGroup: {
    gap: 4,
  },
  title: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
    lineHeight: 22,
  },
  preview: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  footerSection: {
    gap: 6,
    paddingTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  percentNumber: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  hintText: {
    ...Typography.labelSm,
    color: Colors.outline,
  },
  actionBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Rounded.md,
  },
  actionBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
});
