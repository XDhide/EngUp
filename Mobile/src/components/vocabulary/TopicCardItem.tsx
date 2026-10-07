import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { VocabularyTopic } from '../../services/vocabularyService';

interface TopicCardItemProps {
  topic: VocabularyTopic;
  index: number;
  onPress: () => void;
}

// Backend chưa trả tiến độ học theo chủ đề, nên thẻ chỉ hiển thị số từ thật của chủ đề.
export const TopicCardItem: React.FC<TopicCardItemProps> = ({ topic, index, onPress }) => {
  const topicNumber = String(index + 1).padStart(2, '0');

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.topicNum}>CHỦ ĐỀ {topicNumber}</Text>
          <Text style={styles.topicName}>{topic.name}</Text>
        </View>

        {typeof topic.total_words === 'number' && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{topic.total_words} từ</Text>
          </View>
        )}
      </View>

      {!!topic.description && (
        <Text style={styles.description} numberOfLines={3}>
          {topic.description}
        </Text>
      )}

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.learnBtn} onPress={onPress} activeOpacity={0.7}>
          <Text style={styles.learnBtnText}>Xem từ vựng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Rounded.xl,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  titleGroup: {
    flex: 1,
  },
  topicNum: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
    letterSpacing: 1,
  },
  topicName: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Rounded.sm,
  },
  levelText: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
  },
  description: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  progressSection: {
    gap: 6,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  progressCount: {
    ...Typography.labelSm,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  percentText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  learnBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  learnBtnText: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: '700',
  },
});
