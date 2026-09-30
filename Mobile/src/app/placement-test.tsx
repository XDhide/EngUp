import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';
import { AppButton } from '../components/common/AppButton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { PlacementQuestionView } from '../components/placement/PlacementQuestionView';
import { PlacementResultView } from '../components/placement/PlacementResultView';
import { authService, PlacementQuestion } from '../services/authService';
import { errorMessage } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

export default function PlacementTestScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // question_id -> option.id (đúng giá trị backend chấm điểm)
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'test' | 'result'>('test');
  const [suggestedLevel, setSuggestedLevel] = useState<string>('');

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.getPlacementQuestions();
      setQuestions(res.questions ?? []);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được bài kiểm tra.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const currentQ = questions[currentIndex];
  const selectedOpt = currentQ ? answers[currentQ.id] || null : null;

  const handleSelectOption = (optionId: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionId }));
  };

  const submit = async () => {
    const payload = Object.entries(answers).map(([qId, answer]) => ({
      question_id: Number(qId),
      answer,
    }));
    if (payload.length === 0) {
      setError('Bạn cần trả lời ít nhất một câu hỏi để có kết quả.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await authService.submitPlacementTest(payload);
      setSuggestedLevel(res.suggested_level);
      await refreshUser(); // backend cập nhật level_current cho hồ sơ
      setViewMode('result');
    } catch (e) {
      setError(errorMessage(e, 'Không gửi được bài làm. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex((prev) => prev + 1);
    else submit();
  };

  const handleRetest = () => {
    setAnswers({});
    setCurrentIndex(0);
    setSuggestedLevel('');
    setViewMode('test');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title="Kiểm tra trình độ"
        showBack
        onBack={() => router.replace('/(tabs)')}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : viewMode === 'result' ? (
          <PlacementResultView
            suggestedLevel={suggestedLevel}
            onStartLearning={() => router.replace('/(tabs)')}
            onRetest={handleRetest}
          />
        ) : questions.length === 0 ? (
          <View>
            {error && <ErrorBanner message={error} />}
            <AppButton title="Thử tải lại" onPress={loadQuestions} />
          </View>
        ) : currentQ ? (
          <View>
            {error && <ErrorBanner message={error} />}
            <PlacementQuestionView
              question={currentQ}
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              selectedOption={selectedOpt}
              onSelectOption={handleSelectOption}
              onNext={goNext}
              onSkip={goNext}
              isSubmitting={submitting}
            />
          </View>
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
    gap: Spacing.md,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Rounded.md,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    height: 38,
    borderRadius: Rounded.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.surfaceContainerLowest,
    elevation: 1,
  },
  toggleText: {
    ...Typography.labelMd,
    color: Colors.secondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  loader: {
    marginVertical: Spacing.xl,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
