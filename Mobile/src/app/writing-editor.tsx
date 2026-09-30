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
import { WritingFeedbackView } from '../components/writing/WritingFeedbackView';
import {
  writingService,
  WritingPrompt,
  AiFeedback,
  countWords,
} from '../services/writingService';
import { errorMessage } from '../services/apiClient';

interface ViewState {
  content: string;
  score: number | null;
  feedback: AiFeedback | null;
  promptId: number | null;
}

export default function WritingEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const promptIdParam = params.promptId ? Number(params.promptId) : null;
  const submissionId = params.submissionId ? Number(params.submissionId) : null;

  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const [content, setContent] = useState('');
  const [viewing, setViewing] = useState<ViewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [all, detail] = await Promise.all([
        writingService.getAllPrompts(),
        submissionId ? writingService.getSubmission(submissionId) : Promise.resolve(null),
      ]);
      setPrompts(all);
      if (detail) {
        setViewing({
          content: detail.content,
          score: detail.ai_score,
          feedback: detail.ai_feedback,
          promptId: detail.prompt_id,
        });
      }
    } catch (e) {
      setError(errorMessage(e, 'Không tải được đề bài.'));
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    load();
  }, [load]);

  const activePromptId = viewing?.promptId ?? promptIdParam;
  const prompt = useMemo(() => prompts.find((p) => p.id === activePromptId) ?? null, [prompts, activePromptId]);
  const words = countWords(viewing ? viewing.content : content);

  const handleSubmit = async () => {
    if (!prompt || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await writingService.submit(prompt.id, content.trim());
      setViewing({ content: content.trim(), score: res.ai_score, feedback: res.ai_feedback, promptId: prompt.id });
    } catch (e) {
      // Giữ nguyên nội dung đã viết; 429 = hết lượt chấm, 502/504 = AI đang lỗi/quá tải.
      setError(errorMessage(e, 'Không chấm được bài. Vui lòng thử lại sau.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Viết AI" showBack onBack={() => router.back()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : !prompt ? (
            <>
              {error && <ErrorBanner message={error} />}
              <Text style={styles.body}>Không tìm thấy đề bài.</Text>
              <AppButton title="Thử tải lại" onPress={load} />
            </>
          ) : (
            <>
              <View style={styles.promptCard}>
                <Text style={styles.eyebrow}>ĐỀ BÀI</Text>
                <Text style={styles.title}>{prompt.title}</Text>
                <Text style={styles.body}>{prompt.prompt_text}</Text>
              </View>

              {error && <ErrorBanner message={error} />}

              {viewing ? (
                <>
                  <View style={styles.card}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>BÀI VIẾT CỦA BẠN</Text>
                      <Text style={styles.label}>{words} từ</Text>
                    </View>
                    <Text style={styles.body}>{viewing.content}</Text>
                  </View>

                  <WritingFeedbackView score={viewing.score} feedback={viewing.feedback} />

                  <View style={styles.actionRow}>
                    {!submissionId && (
                      <AppButton
                        title="Viết lại"
                        variant="outline"
                        style={styles.flexBtn}
                        onPress={() => {
                          setViewing(null);
                          setContent(viewing.content);
                        }}
                      />
                    )}
                    <AppButton title="Xong" style={styles.flexBtn} onPress={() => router.back()} />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>BÀI VIẾT CỦA BẠN</Text>
                    <Text style={styles.label}>{words} từ</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    multiline
                    textAlignVertical="top"
                    placeholder="Viết bài của bạn bằng tiếng Anh tại đây..."
                    placeholderTextColor={Colors.outline}
                    value={content}
                    onChangeText={setContent}
                    editable={!submitting}
                  />
                  <Text style={styles.hint}>
                    AI sẽ chấm điểm, chỉ ra lỗi ngữ pháp và gợi ý từ vựng. Mỗi ngày có số lượt chấm giới hạn.
                  </Text>
                  <AppButton
                    title={submitting ? 'AI đang chấm bài...' : 'Nộp bài để AI chấm'}
                    onPress={handleSubmit}
                    loading={submitting}
                    disabled={!content.trim()}
                  />
                </>
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
  promptCard: { backgroundColor: Colors.secondaryContainer, borderRadius: Rounded.xl, padding: Spacing.md, gap: 6 },
  eyebrow: { ...Typography.labelSm, color: Colors.onSecondaryContainer, fontWeight: '800', letterSpacing: 1 },
  title: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '700' },
  body: { ...Typography.bodyMd, color: Colors.onSurface, lineHeight: 22 },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.xl, padding: Spacing.md, gap: Spacing.sm },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { ...Typography.labelSm, color: Colors.outline, fontWeight: '700', letterSpacing: 0.5 },
  input: {
    minHeight: 240,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.lg,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.9)',
    padding: Spacing.md,
    ...Typography.bodyLg,
    color: Colors.onSurface,
  },
  hint: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  flexBtn: { flex: 1 },
  bottomSpacer: { height: Spacing.xl },
});
