import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
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
  listeningService,
  ListeningLessonDetail,
  DictationResult,
  diffAgainstTranscript,
} from '../services/listeningService';
import { errorMessage } from '../services/apiClient';

export default function ListeningLessonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lessonId = Number(params.id);

  const [lesson, setLesson] = useState<ListeningLessonDetail | null>(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState<DictationResult | null>(null);
  const [submittedText, setSubmittedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLesson(await listeningService.getLesson(lessonId));
    } catch (e) {
      setError(errorMessage(e, 'Không tải được bài nghe.'));
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await listeningService.submitDictation(lessonId, text.trim());
      setResult(res);
      setSubmittedText(text.trim());
    } catch (e) {
      setError(errorMessage(e, 'Không nộp được bài. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setText('');
    setError(null);
  };

  // Transcript chỉ được dựng sau khi đã nộp bài để không lộ đáp án.
  const diff = useMemo(
    () => (result && lesson ? diffAgainstTranscript(lesson.transcript, submittedText) : []),
    [result, lesson, submittedText]
  );
  const uniqueWrong = useMemo(
    () => Array.from(new Set((result?.wrong_words ?? []).map((w) => w.replace(/[.,!?;:]+$/g, '')))).filter(Boolean),
    [result]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Nghe chép" showBack onBack={() => router.back()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : !lesson ? (
            <>
              {error && <ErrorBanner message={error} />}
              <AppButton title="Thử tải lại" onPress={load} />
            </>
          ) : (
            <>
              <View style={styles.titleGroup}>
                <Text style={styles.eyebrow}>DICTATION</Text>
                <Text style={styles.title}>{lesson.title}</Text>
              </View>

              <AudioPlayer uri={lesson.audio_url} />

              {error && <ErrorBanner message={error} />}

              {!result ? (
                <View style={styles.section}>
                  <Text style={styles.label}>BÀI CHÉP CỦA BẠN</Text>
                  <TextInput
                    style={styles.input}
                    multiline
                    textAlignVertical="top"
                    placeholder="Nghe và gõ lại chính xác nội dung bạn nghe được..."
                    placeholderTextColor={Colors.outline}
                    value={text}
                    onChangeText={setText}
                    autoCapitalize="sentences"
                  />
                  <AppButton
                    title="Nộp bài và chấm điểm"
                    onPress={handleSubmit}
                    loading={submitting}
                    disabled={!text.trim()}
                  />
                </View>
              ) : (
                <View style={styles.section}>
                  <View style={styles.scoreCard}>
                    <Text style={styles.scoreLabel}>ĐỘ CHÍNH XÁC</Text>
                    <Text style={styles.scoreValue}>{result.accuracy_percent}%</Text>
                    <Text style={styles.scoreDesc}>
                      {result.accuracy_percent >= 90
                        ? 'Xuất sắc! Bạn nghe rất chính xác.'
                        : result.accuracy_percent >= 60
                        ? 'Khá tốt. Hãy nghe lại những từ bị sai.'
                        : 'Hãy nghe lại chậm hơn (0.75x) và thử lại.'}
                    </Text>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.label}>ĐÁP ÁN (TỪ SAI TÔ ĐỎ)</Text>
                    <Text style={styles.transcript}>
                      {diff.map((d, i) => (
                        <Text key={i} style={d.correct ? styles.wordOk : styles.wordBad}>
                          {d.word}
                          {i < diff.length - 1 ? ' ' : ''}
                        </Text>
                      ))}
                    </Text>
                  </View>

                  {uniqueWrong.length > 0 && (
                    <View style={styles.card}>
                      <Text style={styles.label}>TỪ CẦN CHÚ Ý ({uniqueWrong.length})</Text>
                      <View style={styles.chipWrap}>
                        {uniqueWrong.map((w) => (
                          <View key={w} style={styles.chip}>
                            <Text style={styles.chipText}>{w}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.actionRow}>
                    <AppButton title="Làm lại" variant="outline" onPress={handleRetry} style={styles.flexBtn} />
                    <AppButton title="Bài khác" onPress={() => router.back()} style={styles.flexBtn} />
                  </View>
                </View>
              )}
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
  titleGroup: { gap: 2 },
  eyebrow: { ...Typography.labelSm, color: Colors.primary, fontWeight: '800', letterSpacing: 1 },
  title: { ...Typography.headlineMd, color: Colors.onSurface, fontWeight: '700' },
  section: { gap: Spacing.md },
  label: { ...Typography.labelSm, color: Colors.outline, fontWeight: '700', letterSpacing: 0.5 },
  input: {
    minHeight: 160,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.lg,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.9)',
    padding: Spacing.md,
    ...Typography.bodyLg,
    color: Colors.onSurface,
  },
  scoreCard: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Rounded.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  scoreLabel: { ...Typography.labelSm, color: Colors.onSecondaryContainer, fontWeight: '700', letterSpacing: 1 },
  scoreValue: { ...Typography.headlineLg, color: Colors.primary, fontWeight: '800', fontSize: 44, lineHeight: 52 },
  scoreDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  transcript: { ...Typography.bodyLg, lineHeight: 28 },
  wordOk: { color: Colors.onSurface },
  wordBad: { color: Colors.error, fontWeight: '700', textDecorationLine: 'underline' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: Colors.errorContainer, borderRadius: Rounded.full, paddingHorizontal: 12, paddingVertical: 4 },
  chipText: { ...Typography.labelMd, color: Colors.onErrorContainer, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  flexBtn: { flex: 1 },
  bottomSpacer: { height: Spacing.xl },
});
