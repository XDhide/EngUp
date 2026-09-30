import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';
import { AppButton } from '../components/common/AppButton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { AudioPlayer } from '../components/common/AudioPlayer';
import {
  testService,
  TestQuestion,
  TestSetSummary,
  AttemptResult,
  isWritingTest,
} from '../services/testService';
import { errorMessage } from '../services/apiClient';
import { countWords } from '../services/writingService';

type Mode = 'loading' | 'intro' | 'taking' | 'result';

interface Choice {
  /** Giá trị gửi lên backend: chữ cái nếu option có tiền tố "A.", ngược lại là nội dung option */
  answer: string;
  letter: string;
  label: string;
}

// Backend chấm bằng so khớp chuỗi chính xác với correct_answer.
function toChoices(options: string[] | null): Choice[] {
  if (!Array.isArray(options)) return [];
  const parsed = options.map((raw, i) => {
    const text = String(raw);
    const m = text.match(/^\s*([A-Za-z])[.)]\s*(.*)$/s);
    return { text, letter: m ? m[1].toUpperCase() : String.fromCharCode(65 + i), label: m ? m[2] : text, prefixed: !!m };
  });
  const allPrefixed = parsed.every((p) => p.prefixed);
  return parsed.map((p) => ({ answer: allPrefixed ? p.letter : p.label, letter: p.letter, label: p.label }));
}

const fmtTime = (sec: number) => {
  const s = Math.max(0, sec);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const scoreText = (examType: string | undefined, band: number | null, score: number | null) => {
  // TOEIC có hai thang (trắc nghiệm quy đổi tới 990, AI chấm writing tới 200) nên không gắn mẫu số cố định.
  if (band !== null) return examType === 'TOEIC' ? `${band} điểm` : `Band ${band}`;
  if (score !== null) return `${score}%`;
  return '—';
};

export default function TestSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const testId = Number(params.testId);
  const viewAttemptId = params.attemptId ? Number(params.attemptId) : null;

  const [mode, setMode] = useState<Mode>('loading');
  const [testSet, setTestSet] = useState<TestSetSummary | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [essay, setEssay] = useState('');
  const [attemptId, setAttemptId] = useState<number | null>(viewAttemptId);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [writingFeedback, setWritingFeedback] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const writing = isWritingTest(questions);

  const load = useCallback(async () => {
    setMode('loading');
    setError(null);
    try {
      const [sets, qs] = await Promise.all([testService.getTestSets(), testService.getQuestions(testId)]);
      setTestSet(sets.find((s) => s.id === testId) ?? null);
      setQuestions(qs);
      if (viewAttemptId) {
        setResult(await testService.getResult(viewAttemptId));
        setMode('result');
      } else {
        setMode('intro');
      }
    } catch (e) {
      setError(errorMessage(e, 'Không tải được đề thi.'));
      setMode('intro');
    }
  }, [testId, viewAttemptId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStart = async () => {
    setError(null);
    try {
      const started = await testService.start(testId);
      setAttemptId(started.attempt_id);
      setSecondsLeft(Math.round(started.time_limit_minutes * 60));
      submittedRef.current = false;
      setMode('taking');
    } catch (e) {
      setError(errorMessage(e, 'Không bắt đầu được bài thi.'));
    }
  };

  const doSubmit = useCallback(async () => {
    if (!attemptId || submittedRef.current) return;
    setSubmitting(true);
    setError(null);
    try {
      if (writing) {
        if (!essay.trim()) throw new Error('Bạn chưa viết nội dung nào.');
        const res = await testService.submitWriting(testId, attemptId, essay.trim());
        setResult({ score: null, band_score: res.band_score, answers_review: [] });
        setWritingFeedback(typeof res.feedback === 'string' ? res.feedback : null);
      } else {
        const payload = Object.entries(answers)
          .filter(([, a]) => a.trim() !== '')
          .map(([qid, answer]) => ({ question_id: Number(qid), answer: answer.trim() }));
        if (payload.length === 0) throw new Error('Hãy trả lời ít nhất một câu trước khi nộp bài.');
        await testService.submit(testId, attemptId, payload);
        setResult(await testService.getResult(attemptId));
      }
      submittedRef.current = true;
      setMode('result');
    } catch (e) {
      setError(errorMessage(e, 'Không nộp được bài. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, writing, essay, answers, testId]);

  // Đồng hồ đếm ngược; hết giờ thì tự nộp bài.
  useEffect(() => {
    if (mode !== 'taking') return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    if (mode === 'taking' && secondsLeft === 0 && attemptId && !submittedRef.current && !submitting) {
      doSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, mode]);

  const answeredCount = writing ? (essay.trim() ? 1 : 0) : Object.values(answers).filter((a) => a.trim() !== '').length;
  const totalCount = writing ? 1 : questions.length;

  const confirmSubmit = () => {
    const missing = totalCount - answeredCount;
    if (missing > 0 && !writing) {
      Alert.alert('Nộp bài', `Bạn còn ${missing} câu chưa trả lời. Vẫn nộp bài?`, [
        { text: 'Làm tiếp', style: 'cancel' },
        { text: 'Nộp bài', onPress: doSubmit },
      ]);
    } else {
      doSubmit();
    }
  };

  const confirmExit = () => {
    if (mode !== 'taking') return router.back();
    Alert.alert('Thoát bài thi', 'Bài làm hiện tại sẽ không được lưu.', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Thoát', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const questionById = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const isUrgent = secondsLeft > 0 && secondsLeft <= 60;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title={testSet?.title ?? 'Luyện đề'}
        showBack
        backLabel={mode === 'taking' ? 'Thoát' : 'Quay lại'}
        onBack={confirmExit}
      />

      {mode === 'taking' && (
        <View style={styles.timerBar}>
          <Text style={styles.timerLabel}>
            Đã trả lời {answeredCount}/{totalCount}
          </Text>
          <Text style={[styles.timerValue, isUrgent && styles.timerUrgent]}>{fmtTime(secondsLeft)}</Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error && <ErrorBanner message={error} />}

          {mode === 'loading' && <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />}

          {mode === 'intro' && (
            <View style={styles.introCard}>
              {testSet ? (
                <>
                  <Text style={styles.eyebrow}>{testSet.exam_type} · {testSet.section.toUpperCase()}</Text>
                  <Text style={styles.title}>{testSet.title}</Text>
                  <Text style={styles.body}>Thời gian làm bài: {testSet.time_limit_minutes} phút.</Text>
                  <Text style={styles.body}>
                    {writing
                      ? 'Đề tự luận: bài viết sẽ được AI chấm theo tiêu chí của kỳ thi.'
                      : `Gồm ${questions.length} câu hỏi. Đáp án được chấm khớp chính xác (phân biệt chữ hoa/thường với câu điền từ).`}
                  </Text>
                  <Text style={styles.body}>Đồng hồ bắt đầu chạy ngay khi bạn bấm &quot;Bắt đầu&quot;. Hết giờ bài sẽ tự động nộp.</Text>
                  <AppButton title="Bắt đầu làm bài" onPress={handleStart} disabled={questions.length === 0} />
                  {questions.length === 0 && <Text style={styles.body}>Đề này chưa có câu hỏi.</Text>}
                </>
              ) : (
                <>
                  <Text style={styles.body}>Không tải được thông tin đề thi.</Text>
                  <AppButton title="Thử lại" onPress={load} />
                </>
              )}
            </View>
          )}

          {mode === 'taking' && (
            <>
              {questions.map((q, idx) => {
                const prevPassage = idx > 0 ? questions[idx - 1].passage_text : null;
                const showPassage = !!q.passage_text && q.passage_text !== prevPassage;
                const choices = q.question_type === 'multiple_choice' ? toChoices(q.options) : [];
                return (
                  <View key={q.id} style={styles.questionBlock}>
                    {showPassage && (
                      <View style={styles.passage}>
                        <Text style={styles.label}>BÀI ĐỌC</Text>
                        <Text style={styles.body}>{q.passage_text}</Text>
                      </View>
                    )}
                    {!!q.audio_url && <AudioPlayer uri={q.audio_url} />}

                    <View style={styles.questionCard}>
                      <Text style={styles.label}>CÂU {idx + 1}/{questions.length}</Text>
                      <Text style={styles.questionText}>{q.question_text}</Text>

                      {q.question_type === 'multiple_choice' &&
                        choices.map((c) => {
                          const selected = answers[q.id] === c.answer;
                          return (
                            <TouchableOpacity
                              key={c.letter + c.label}
                              style={[styles.option, selected && styles.optionSelected]}
                              onPress={() => setAnswers((p) => ({ ...p, [q.id]: c.answer }))}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.optionKey, selected && styles.optionKeySelected]}>{c.letter}</Text>
                              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{c.label}</Text>
                            </TouchableOpacity>
                          );
                        })}

                      {q.question_type === 'fill_blank' && (
                        <TextInput
                          style={styles.fillInput}
                          placeholder="Nhập đáp án..."
                          placeholderTextColor={Colors.outline}
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={answers[q.id] ?? ''}
                          onChangeText={(t) => setAnswers((p) => ({ ...p, [q.id]: t }))}
                        />
                      )}

                      {(q.question_type === 'essay' || q.question_type === 'speaking_prompt') && (
                        <>
                          <TextInput
                            style={styles.essayInput}
                            multiline
                            textAlignVertical="top"
                            placeholder={
                              q.question_type === 'speaking_prompt'
                                ? 'Nhập câu trả lời của bạn (dạng văn bản)...'
                                : 'Viết bài của bạn tại đây...'
                            }
                            placeholderTextColor={Colors.outline}
                            value={essay}
                            onChangeText={setEssay}
                          />
                          <Text style={styles.hint}>{countWords(essay)} từ</Text>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}

              <AppButton title="Nộp bài" onPress={confirmSubmit} loading={submitting} />
            </>
          )}

          {mode === 'result' && result && (
            <>
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>KẾT QUẢ</Text>
                <Text style={styles.scoreValue}>{scoreText(testSet?.exam_type, result.band_score, result.score)}</Text>
                {result.score !== null && result.band_score !== null && (
                  <Text style={styles.scoreDesc}>Tỉ lệ đúng {result.score}%</Text>
                )}
              </View>

              {!!writingFeedback && (
                <View style={styles.reviewCard}>
                  <Text style={styles.label}>NHẬN XÉT CỦA AI</Text>
                  <Text style={styles.body}>{writingFeedback}</Text>
                </View>
              )}

              {result.answers_review.length > 0 && (
                <View style={styles.reviewCard}>
                  <Text style={styles.label}>CHI TIẾT TỪNG CÂU</Text>
                  {result.answers_review.map((r, i) => {
                    const q = questionById.get(r.question_id);
                    return (
                      <View key={r.question_id} style={[styles.reviewItem, r.is_correct ? styles.reviewOk : styles.reviewBad]}>
                        <Text style={styles.reviewHead}>
                          Câu {i + 1}: {r.is_correct ? 'Đúng' : 'Sai'}
                        </Text>
                        {!!q && <Text style={styles.body}>{q.question_text}</Text>}
                        <Text style={styles.body}>
                          Bạn trả lời: <Text style={styles.bold}>{r.your_answer ?? '(bỏ trống)'}</Text>
                        </Text>
                        {!r.is_correct && (
                          <Text style={styles.body}>
                            Đáp án đúng: <Text style={styles.bold}>{r.correct_answer}</Text>
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              <AppButton title="Về danh sách đề" onPress={() => router.back()} />
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingHorizontal: Spacing.margin, paddingVertical: Spacing.md, gap: Spacing.md },
  loader: { marginVertical: Spacing.xl },
  timerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.margin,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 227, 246, 0.6)',
  },
  timerLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  timerValue: { ...Typography.titleSm, color: Colors.primary, fontWeight: '800' },
  timerUrgent: { color: Colors.error },
  introCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.xl, padding: Spacing.lg, gap: Spacing.sm },
  eyebrow: { ...Typography.labelSm, color: Colors.primary, fontWeight: '800', letterSpacing: 1 },
  title: { ...Typography.headlineMd, color: Colors.onSurface, fontWeight: '700' },
  body: { ...Typography.bodyMd, color: Colors.onSurface, lineHeight: 22 },
  bold: { fontWeight: '700' },
  label: { ...Typography.labelSm, color: Colors.outline, fontWeight: '700', letterSpacing: 0.5 },
  hint: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  questionBlock: { gap: Spacing.sm },
  passage: { backgroundColor: Colors.secondaryContainer, borderRadius: Rounded.xl, padding: Spacing.md, gap: 6 },
  questionCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.xl, padding: Spacing.md, gap: Spacing.sm },
  questionText: { ...Typography.bodyLg, color: Colors.onSurface, fontWeight: '600' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm + 2,
    borderRadius: Rounded.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionSelected: { backgroundColor: Colors.secondaryContainer, borderColor: Colors.primaryContainer },
  optionKey: { ...Typography.labelMd, color: Colors.onSurfaceVariant, fontWeight: '800', width: 22, textAlign: 'center' },
  optionKeySelected: { color: Colors.primary },
  optionLabel: { ...Typography.bodyMd, color: Colors.onSurface, flex: 1 },
  optionLabelSelected: { fontWeight: '700' },
  fillInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.bodyLg,
    color: Colors.onSurface,
  },
  essayInput: {
    minHeight: 220,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.md,
    padding: Spacing.md,
    ...Typography.bodyLg,
    color: Colors.onSurface,
  },
  scoreCard: { backgroundColor: Colors.secondaryContainer, borderRadius: Rounded.xl, padding: Spacing.lg, alignItems: 'center', gap: 4 },
  scoreLabel: { ...Typography.labelSm, color: Colors.onSecondaryContainer, fontWeight: '700', letterSpacing: 1 },
  scoreValue: { color: Colors.primary, fontWeight: '800', fontSize: 40, lineHeight: 48 },
  scoreDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  reviewCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.xl, padding: Spacing.md, gap: Spacing.sm },
  reviewItem: { borderRadius: Rounded.md, padding: Spacing.sm + 2, gap: 2 },
  reviewOk: { backgroundColor: Colors.secondaryContainer },
  reviewBad: { backgroundColor: Colors.errorContainer },
  reviewHead: { ...Typography.labelMd, color: Colors.onSurface, fontWeight: '800' },
  bottomSpacer: { height: Spacing.xl },
});
