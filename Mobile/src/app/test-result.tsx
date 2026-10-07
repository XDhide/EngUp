import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';
import { AppButton } from '../components/common/AppButton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { testService, AttemptResult, TestSetSummary } from '../services/testService';
import { errorMessage } from '../services/apiClient';

const scoreText = (examType: string | undefined, band: number | null, score: number | null) => {
  if (band !== null) return examType === 'TOEIC' ? `${band} điểm` : `Band ${band}`;
  if (score !== null) return `${score}%`;
  return '—';
};

// Xem lại kết quả một lượt làm đề đã nộp: /test-result?attemptId=...&testId=...
export default function TestResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const attemptId = Number(params.attemptId);
  const testId = Number(params.testId);

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [testSet, setTestSet] = useState<TestSetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(attemptId)) {
      setError('Thiếu mã lượt làm bài.');
      setLoading(false);
      return;
    }
    const [r, sets] = await Promise.allSettled([testService.getResult(attemptId), testService.getTestSets()]);
    if (r.status === 'fulfilled') {
      setResult(r.value);
      setError(null);
    } else {
      setError(errorMessage(r.reason, 'Không tải được kết quả bài thi.'));
    }
    if (sets.status === 'fulfilled') setTestSet(sets.value.find((s) => s.id === testId) ?? null);
    setLoading(false);
  }, [attemptId, testId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const correct = result ? result.answers_review.filter((a) => a.is_correct).length : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Kết quả thi" showBack onBack={() => router.back()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error && <ErrorBanner message={error} />}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          result && (
            <>
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>{testSet ? testSet.title.toUpperCase() : 'KẾT QUẢ'}</Text>
                <Text style={styles.scoreValue}>{scoreText(testSet?.exam_type, result.band_score, result.score)}</Text>
                {result.answers_review.length > 0 && (
                  <Text style={styles.scoreDesc}>
                    Đúng {correct}/{result.answers_review.length} câu
                    {result.score !== null && result.band_score !== null ? ` · Tỉ lệ đúng ${result.score}%` : ''}
                  </Text>
                )}
              </View>

              {typeof result.feedback === 'string' && result.feedback.trim() !== '' && (
                <View style={styles.card}>
                  <Text style={styles.label}>NHẬN XÉT CỦA AI</Text>
                  <Text style={styles.body}>{result.feedback}</Text>
                </View>
              )}

              {result.answers_review.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.label}>CHI TIẾT TỪNG CÂU</Text>
                  {result.answers_review.map((r, i) => (
                    <View key={r.question_id} style={[styles.item, r.is_correct ? styles.ok : styles.bad]}>
                      <Text style={styles.itemHead}>
                        Câu {i + 1}: {r.is_correct ? 'Đúng' : 'Sai'}
                      </Text>
                      <Text style={styles.body}>
                        Bạn trả lời: <Text style={styles.bold}>{r.your_answer ?? '(bỏ trống)'}</Text>
                      </Text>
                      {!r.is_correct && (
                        <Text style={styles.body}>
                          Đáp án đúng: <Text style={styles.bold}>{r.correct_answer}</Text>
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <AppButton title="Về danh sách đề" onPress={() => router.replace('/test-list')} />
            </>
          )
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingHorizontal: Spacing.margin, paddingVertical: Spacing.md, gap: Spacing.md },
  loader: { marginVertical: Spacing.xl },
  scoreCard: { backgroundColor: Colors.primaryContainer, borderRadius: Rounded.xl, padding: Spacing.lg, alignItems: 'center', gap: 4 },
  scoreLabel: { ...Typography.labelSm, color: Colors.onPrimaryContainer, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },
  scoreValue: { ...Typography.titleSm, fontSize: 36, color: Colors.onPrimaryContainer, fontWeight: '800' },
  scoreDesc: { ...Typography.bodyMd, color: Colors.onPrimaryContainer },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.xl, padding: Spacing.md, gap: Spacing.sm },
  label: { ...Typography.labelSm, color: Colors.outline, fontWeight: '700', letterSpacing: 0.5 },
  body: { ...Typography.bodyMd, color: Colors.onSurface },
  bold: { fontWeight: '700' },
  item: { borderRadius: Rounded.md, padding: Spacing.sm, gap: 2, borderLeftWidth: 4 },
  ok: { backgroundColor: Colors.surfaceContainerLow, borderLeftColor: Colors.primary },
  bad: { backgroundColor: Colors.surfaceContainerLow, borderLeftColor: Colors.error },
  itemHead: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '700' },
  bottomSpacer: { height: Spacing.xl },
});
