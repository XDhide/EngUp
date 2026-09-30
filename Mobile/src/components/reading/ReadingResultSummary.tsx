import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { ReadingSubmitResult, ReadingQuestion, parseOptions } from '../../services/readingService';

interface ReadingResultSummaryProps {
  result: ReadingSubmitResult;
  /** Danh sách câu hỏi và đáp án đã chọn để hiển thị chi tiết từng câu */
  questions?: ReadingQuestion[];
  answers?: Record<number, string>;
  onFinish: () => void;
  onRetry: () => void;
}

export const ReadingResultSummary: React.FC<ReadingResultSummaryProps> = ({
  result,
  questions = [],
  answers = {},
  onFinish,
  onRetry,
}) => {
  const percent = result.total_count > 0 ? Math.round((result.correct_count / result.total_count) * 100) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.scoreCircle}>
        <Text style={styles.scoreNumber}>{result.correct_count}/{result.total_count}</Text>
        <Text style={styles.scoreLabel}>ĐÚNG</Text>
      </View>

      <View style={styles.textGroup}>
        <Text style={styles.resultTitle}>
          {percent >= 80 ? 'Xuất sắc!' : percent >= 50 ? 'Khá tốt!' : 'Cần cố gắng hơn!'}
        </Text>
        <Text style={styles.resultDesc}>
          Bạn đã trả lời đúng {result.correct_count} trên tổng số {result.total_count} câu hỏi ({percent}%).
        </Text>
      </View>

      {result.review && result.review.length > 0 && (
        <View style={styles.reviewList}>
          <Text style={styles.reviewHeader}>CHI TIẾT ĐÁP ÁN</Text>
          {result.review.map((item, idx) => {
            const q = questions.find((x) => x.id === item.question_id);
            const options = q ? parseOptions(q.options) : [];
            const labelOf = (key?: string) => options.find((o) => o.key === key)?.label;
            const correctLabel = labelOf(item.correct_answer);
            return (
            <View key={idx} style={styles.reviewItem}>
              <View style={styles.reviewRow}>
                <Text style={styles.questionNum}>Câu {idx + 1}:</Text>
                <Text
                  style={[
                    styles.statusBadge,
                    item.is_correct ? styles.correctBadge : styles.wrongBadge,
                  ]}
                >
                  {item.is_correct ? 'Đúng' : 'Sai'}
                </Text>
              </View>

              {!!q && <Text style={styles.explanationText}>{q.question_text}</Text>}

              {!item.is_correct && (
                <Text style={styles.answerDetail}>
                  Bạn chọn: <Text style={styles.bold}>{answers[item.question_id] ?? '—'}</Text>
                  {' · '}Đáp án đúng:{' '}
                  <Text style={styles.bold}>
                    {item.correct_answer}
                    {correctLabel ? `. ${correctLabel}` : ''}
                  </Text>
                </Text>
              )}
            </View>
            );
          })}
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.btn, styles.retryBtn]} onPress={onRetry}>
          <Text style={styles.retryBtnText}>Làm lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.finishBtn]} onPress={onFinish}>
          <Text style={styles.finishBtnText}>Hoàn thành</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    ...Typography.headlineLg,
    color: Colors.primary,
    fontWeight: '800',
  },
  scoreLabel: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  textGroup: {
    alignItems: 'center',
    gap: 4,
  },
  resultTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  resultDesc: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  reviewList: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  reviewHeader: {
    ...Typography.labelSm,
    color: Colors.outline,
    fontWeight: '700',
    letterSpacing: 1,
  },
  reviewItem: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.md,
    padding: Spacing.sm,
    gap: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionNum: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  statusBadge: {
    ...Typography.labelSm,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  correctBadge: {
    backgroundColor: Colors.secondaryContainer,
    color: Colors.primary,
  },
  wrongBadge: {
    backgroundColor: Colors.errorContainer,
    color: Colors.onErrorContainer,
  },
  answerDetail: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  bold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  explanationText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.sm,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  retryBtnText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  finishBtn: {
    backgroundColor: Colors.primaryContainer,
  },
  finishBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
});
