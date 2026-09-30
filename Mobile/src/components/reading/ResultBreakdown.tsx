import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/design';

type SubmitReadingResult = {
  score: number;
  total: number;
  accuracy: number;
  bandScore: number;
  results: Array<{ questionId: string; correct: boolean; userAnswer: string; correctAnswer: string; explanation: string }>;
};

interface ResultBreakdownProps {
  results: SubmitReadingResult;
  onRetry: () => void;
  onContinue: () => void;
}

export const ResultBreakdown: React.FC<ResultBreakdownProps> = ({ results, onRetry, onContinue }) => {
  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Rất tốt!</Text>
        <Text style={styles.bannerDesc}>Bạn đã hoàn thành bài đọc hiểu.</Text>
        <View style={styles.scoreRow}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreVal}>{results.score}/{results.total}</Text>
            <Text style={styles.scoreLabel}>Điểm số</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreVal}>{Math.round(results.accuracy * 100)}%</Text>
            <Text style={styles.scoreLabel}>Độ chính xác</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreVal}>{results.bandScore}</Text>
            <Text style={styles.scoreLabel}>Band Score</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Chi tiết kết quả</Text>
      
      {results.results.map((r, i) => (
        <View key={r.questionId || i} style={styles.resultCard}>
          <View style={styles.qHeader}>
            <Text style={styles.qNum}>Câu {i + 1}</Text>
            <View style={[styles.statusBadge, r.correct ? styles.statusCorrect : styles.statusWrong]}>
              <Text style={[styles.statusText, r.correct ? styles.textCorrect : styles.textWrong]}>
                {r.correct ? 'Đúng' : 'Sai'}
              </Text>
            </View>
          </View>
          <View style={styles.answerRow}>
            <Text style={styles.answerLabel}>Của bạn: <Text style={r.correct ? styles.textCorrect : styles.textWrong}>{r.userAnswer}</Text></Text>
            {!r.correct && (
              <Text style={styles.answerLabel}>Đáp án: <Text style={styles.textCorrect}>{r.correctAnswer}</Text></Text>
            )}
          </View>
          {r.explanation && (
            <Text style={styles.explanation}>{r.explanation}</Text>
          )}
        </View>
      ))}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
          <Text style={styles.continueText}>Tiếp tục bài đọc khác</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Làm lại bài này</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  banner: {
    backgroundColor: Colors.primaryContainer,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  bannerDesc: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    justifyContent: 'space-around',
  },
  scoreBox: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    flex: 1,
  },
  scoreVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  resultCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  qNum: {
    fontWeight: 'bold',
    color: Colors.onSurface,
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusCorrect: {
    backgroundColor: '#d1fae5',
  },
  statusWrong: {
    backgroundColor: Colors.errorContainer,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  textCorrect: {
    color: Colors.primary,
  },
  textWrong: {
    color: Colors.error,
  },
  answerRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  answerLabel: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  explanation: {
    fontSize: 14,
    color: Colors.onSurface,
    fontStyle: 'italic',
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
  },
  actions: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  retryBtn: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
