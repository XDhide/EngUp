import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { FilterChip } from '../common/FilterChip';
import { ErrorBanner } from '../common/ErrorBanner';
import { PracticeItemCard, PanelMessage } from './PracticeItemCard';
import { testService, TestSetSummary, AttemptSummary } from '../../services/testService';
import { errorMessage } from '../../services/apiClient';

const SECTION_LABEL: Record<string, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
};

export const TestPanel: React.FC<{ refreshKey: number; onLoaded: () => void }> = ({ refreshKey, onLoaded }) => {
  const router = useRouter();
  const [sets, setSets] = useState<TestSetSummary[]>([]);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [examFilter, setExamFilter] = useState<'all' | 'IELTS' | 'TOEIC'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, a] = await Promise.allSettled([testService.getTestSets(), testService.getAttempts()]);
    if (s.status === 'fulfilled') setSets(s.value);
    if (a.status === 'fulfilled') setAttempts(a.value);
    const failed = [s, a].find((r) => r.status === 'rejected');
    setError(failed && failed.status === 'rejected' ? errorMessage(failed.reason, 'Không tải được danh sách đề thi.') : null);
    setLoading(false);
    onLoaded();
  }, [onLoaded]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, refreshKey])
  );

  const titleOf = useMemo(() => {
    const m = new Map(sets.map((s) => [s.id, s.title]));
    return (id: number) => m.get(id) ?? `Đề #${id}`;
  }, [sets]);
  const examOf = useMemo(() => {
    const m = new Map(sets.map((s) => [s.id, s.exam_type]));
    return (id: number) => m.get(id);
  }, [sets]);

  const filtered = sets.filter((s) => examFilter === 'all' || s.exam_type === examFilter);
  const finished = attempts.filter((a) => a.status !== 'in_progress');

  return (
    <>
      <Text style={styles.intro}>Làm đề thi thử IELTS / TOEIC có tính giờ, nhận điểm và xem lại đáp án.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {(['all', 'IELTS', 'TOEIC'] as const).map((f) => (
          <FilterChip key={f} label={f === 'all' ? 'Tất cả' : f} isActive={examFilter === f} onPress={() => setExamFilter(f)} />
        ))}
      </ScrollView>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <>
          {filtered.length === 0 && !error ? (
            <PanelMessage title="Chưa có đề thi" description="Hiện chưa có đề thi nào được mở." />
          ) : (
            <View style={styles.list}>
              {filtered.map((t) => (
                <PracticeItemCard
                  key={t.id}
                  title={t.title}
                  badges={[t.exam_type, SECTION_LABEL[t.section] ?? t.section]}
                  meta={`Thời gian: ${t.time_limit_minutes} phút`}
                  ctaLabel="Làm bài"
                  onPress={() => router.push({ pathname: '/test-session', params: { testId: String(t.id) } })}
                />
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Lịch sử làm đề</Text>
          {finished.length === 0 ? (
            <Text style={styles.intro}>Bạn chưa hoàn thành đề nào.</Text>
          ) : (
            <View style={styles.list}>
              {finished.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.historyRow}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({ pathname: '/test-result', params: { attemptId: String(a.id), testId: String(a.test_set_id) } })
                  }
                >
                  <View style={styles.historyText}>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {titleOf(a.test_set_id)}
                    </Text>
                    <Text style={styles.historyDate}>
                      {a.submitted_at ? new Date(a.submitted_at).toLocaleString('vi-VN') : '—'}
                    </Text>
                  </View>
                  <View style={styles.scorePill}>
                    <Text style={styles.scoreText}>
                      {a.band_score !== null
                        ? examOf(a.test_set_id) === 'TOEIC'
                          ? `${a.band_score} điểm`
                          : `Band ${a.band_score}`
                        : a.score !== null
                        ? `${a.score}%`
                        : 'Chờ chấm'}
                    </Text>
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
