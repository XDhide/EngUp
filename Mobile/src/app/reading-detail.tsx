import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';
import { ReadingQuestionItem } from '../components/reading/ReadingQuestionItem';
import { ReadingResultSummary } from '../components/reading/ReadingResultSummary';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { AppButton } from '../components/common/AppButton';
import {
  readingService,
  ReadingArticle,
  ReadingSubmitResult,
} from '../services/readingService';
import { errorMessage } from '../services/apiClient';

export default function ReadingDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const articleId = Number(params.id);

  const [article, setArticle] = useState<ReadingArticle | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReadingSubmitResult | null>(null);
  const [mode, setMode] = useState<'reading' | 'quiz' | 'result'>('reading');

  const loadArticle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setArticle(await readingService.getArticleDetail(articleId));
    } catch (e) {
      setError(errorMessage(e, 'Không tải được bài đọc.'));
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  const questions = article?.questions ?? [];
  const currentQ = questions[currentQuestionIdx];
  const readingMinutes = article
    ? Math.max(1, Math.ceil(article.content.trim().split(/\s+/).length / 200))
    : 0;

  const handleSelectOption = (optKey: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optKey }));
  };

  const handleNextQuiz = async () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = questions.map((q) => ({ question_id: q.id, answer: answers[q.id] }));
      const res = await readingService.submitArticle(articleId, payload);
      setResult(res);
      setMode('result');
    } catch (e) {
      setError(errorMessage(e, 'Không nộp được bài. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestionIdx(0);
    setResult(null);
    setError(null);
    setMode('quiz');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title={mode === 'reading' ? 'Bài Đọc' : mode === 'quiz' ? 'Luyện Trắc Nghiệm' : 'Kết Quả Bài Đọc'}
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/notes', params: { ref_type: 'reading', ref_id: String(articleId), ref_label: article?.title ?? '' } })}
            hitSlop={8}
          >
            <Text style={{ fontSize: 22 }}>📝</Text>
          </TouchableOpacity>
        }
        onBack={() => {
          if (mode === 'quiz') setMode('reading');
          else router.back();
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {error && <ErrorBanner message={error} />}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : !article ? (
          <AppButton title="Thử tải lại" onPress={loadArticle} />
        ) : article ? (
          <>
            {mode === 'reading' && (
              <View style={styles.readingSection}>
                {/* Article Header Meta */}
                <View style={styles.metaRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{article.topic || 'Chủ đề'}</Text>
                  </View>
                  <Text style={styles.levelText}>{article.difficulty || ''}</Text>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.readTimeText}>
                    {readingMinutes} phút đọc
                  </Text>
                </View>

                {/* Article Title */}
                <Text style={styles.articleTitle}>{article.title}</Text>

                {/* Passage */}
                <View style={styles.passageCard}>
                  <Text style={styles.passageText}>{article.content}</Text>
                </View>

                {/* Quiz Start Button */}
                {questions.length > 0 ? (
                  <TouchableOpacity
                    style={styles.startQuizBtn}
                    onPress={() => setMode('quiz')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.startQuizBtnText}>
                      Bắt đầu làm {questions.length} câu hỏi trắc nghiệm
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.readTimeText}>Bài đọc này chưa có câu hỏi.</Text>
                )}
              </View>
            )}

            {mode === 'quiz' && currentQ && (
              <View style={styles.quizSection}>
                <ReadingQuestionItem
                  question={currentQ}
                  questionIndex={currentQuestionIdx}
                  totalQuestions={questions.length}
                  selectedOption={answers[currentQ.id] || null}
                  onSelectOption={handleSelectOption}
                />

                <View style={styles.quizActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.nextQuizBtn,
                      !answers[currentQ.id] && styles.btnDisabled,
                    ]}
                    onPress={handleNextQuiz}
                    disabled={!answers[currentQ.id] || submitting}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.nextQuizBtnText}>
                      {currentQuestionIdx === questions.length - 1
                        ? 'Nộp bài & Xem kết quả'
                        : 'Câu tiếp theo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {mode === 'result' && result && (
              <ReadingResultSummary
                result={result}
                questions={questions}
                answers={answers}
                onFinish={() => router.replace('/(tabs)/practice')}
                onRetry={handleRetry}
              />
            )}
          </>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    paddingHorizontal: Spacing.margin,
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  readingSection: {
    gap: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  badgeText: {
    ...Typography.labelSm,
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  levelText: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
  },
  dot: {
    color: Colors.outline,
  },
  readTimeText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  articleTitle: {
    ...Typography.headlineLg,
    color: Colors.onSurface,
    lineHeight: 32,
  },
  passageCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  passageText: {
    ...Typography.bodyLg,
    color: Colors.onSurface,
    lineHeight: 28,
  },
  startQuizBtn: {
    height: 52,
    borderRadius: Rounded.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  startQuizBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  quizSection: {
    gap: Spacing.lg,
  },
  quizActionRow: {
    paddingTop: Spacing.xs,
  },
  nextQuizBtn: {
    height: 50,
    borderRadius: Rounded.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  nextQuizBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  loader: {
    marginVertical: Spacing.xl,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
