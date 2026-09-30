import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { FilterChip } from '../common/FilterChip';
import { ErrorBanner } from '../common/ErrorBanner';
import { PracticeItemCard, PanelMessage } from './PracticeItemCard';
import {
  writingService,
  WritingPrompt,
  WritingSubmission,
  WRITING_TYPES,
} from '../../services/writingService';
import { readingLevelLabel } from '../reading/ReadingArticleCard';
import { errorMessage } from '../../services/apiClient';

export const WritingPanel: React.FC<{ refreshKey: number; onLoaded: () => void }> = ({ refreshKey, onLoaded }) => {
  const router = useRouter();
  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const [history, setHistory] = useState<WritingSubmission[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'ielts' | 'toeic'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, h] = await Promise.allSettled([writingService.getAllPrompts(), writingService.getSubmissions()]);
    if (p.status === 'fulfilled') setPrompts(p.value);
    if (h.status === 'fulfilled') setHistory(h.value);
    const failed = [p, h].find((r) => r.status === 'rejected');
    setError(failed && failed.status === 'rejected' ? errorMessage(failed.reason, 'Không tải được dữ liệu bài viết.') : null);
    setLoading(false);
    onLoaded();
  }, [onLoaded]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, refreshKey])
  );

  const promptTitle = useMemo(() => {
    const m = new Map(prompts.map((p) => [p.id, p.title]));
    return (id: number) => m.get(id) ?? `Đề bài #${id}`;
  }, [prompts]);

  const todayCount = history.filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString()).length;
  const filtered = prompts.filter((p) => typeFilter === 'all' || p.type === typeFilter);

  return (
    <>
      <Text style={styles.intro}>
        Viết bài theo đề, AI sẽ nhận xét ngữ pháp, gợi ý từ vựng và chấm điểm. Hôm nay bạn đã nộp {todayCount} bài.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <FilterChip label="Tất cả" isActive={typeFilter === 'all'} onPress={() => setTypeFilter('all')} />
        {WRITING_TYPES.map((t) => (
          <FilterChip key={t.key} label={t.label} isActive={typeFilter === t.key} onPress={() => setTypeFilter(t.key)} />
        ))}
      </ScrollView>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <>
          {filtered.length === 0 && !error ? (
            <PanelMessage title="Chưa có đề bài" description="Chưa có đề viết nào thuộc loại này." />
          ) : (
            <View style={styles.list}>
              {filtered.map((p) => (
                <PracticeItemCard
                  key={`${p.type}-${p.id}`}
                  title={p.title}
                  badges={[
                    WRITING_TYPES.find((t) => t.key === p.type)?.label ?? 'Viết',
                    ...(p.difficulty ? [readingLevelLabel(p.difficulty)] : []),
                  ]}
                  description={p.prompt_text}
                  ctaLabel="Viết bài"
                  onPress={() => router.push({ pathname: '/writing-editor', params: { promptId: String(p.id) } })}
                />
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Bài đã nộp</Text>
          {history.length === 0 ? (
            <Text style={styles.intro}>Bạn chưa nộp bài viết nào.</Text>
          ) : (
            <View style={styles.list}>
              {history.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.historyRow}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/writing-editor', params: { submissionId: String(s.id) } })}
                >
                  <View style={styles.historyText}>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {promptTitle(s.prompt_id)}
                    </Text>
                    <Text style={styles.historyDate}>{new Date(s.created_at).toLocaleString('vi-VN')}</Text>
                  </View>
                  <View style={styles.scorePill}>
                    <Text style={styles.scoreText}>{s.ai_score !== null ? `Điểm ${s.ai_score}/100` : 'Chưa có điểm'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  intro: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  filterRow: { gap: 8, paddingVertical: 2 },
  list: { gap: Spacing.md },
  loader: { marginVertical: Spacing.xl },
  sectionTitle: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '700', paddingTop: Spacing.sm },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  historyText: { flex: 1, gap: 2 },
  historyTitle: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '600' },
  historyDate: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  scorePill: { backgroundColor: Colors.secondaryContainer, borderRadius: Rounded.full, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText: { ...Typography.labelSm, color: Colors.primary, fontWeight: '700' },
});
