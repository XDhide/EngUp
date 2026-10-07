import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { FilterChip } from '../common/FilterChip';
import { ErrorBanner } from '../common/ErrorBanner';
import { PracticeItemCard, PanelMessage } from './PracticeItemCard';
import { LEVEL_FILTERS } from './ReadingPanel';
import { listeningService, ListeningLessonSummary } from '../../services/listeningService';
import { difficultyGroup } from '../../services/vocabularyService';
import { readingLevelLabel } from '../reading/ReadingArticleCard';
import { errorMessage } from '../../services/apiClient';

export const ListeningPanel: React.FC<{ refreshKey: number; onLoaded: () => void }> = ({ refreshKey, onLoaded }) => {
  const router = useRouter();
  const [lessons, setLessons] = useState<ListeningLessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      setLessons((await listeningService.getLessons()).lessons);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được danh sách bài nghe.'));
    } finally {
      setLoading(false);
      onLoaded();
    }
  }, [onLoaded]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, refreshKey])
  );

  const filtered = lessons.filter((l) => levelFilter === 'all' || difficultyGroup(l.difficulty) === levelFilter);

  return (
    <>
      <Text style={styles.intro}>
        Nghe đoạn audio và gõ lại chính xác những gì bạn nghe được. Hệ thống chấm độ chính xác theo từng từ.
      </Text>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>CẤP ĐỘ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {LEVEL_FILTERS.map((f) => (
            <FilterChip key={f.id} label={f.label} isActive={levelFilter === f.id} onPress={() => setLevelFilter(f.id)} />
          ))}
        </ScrollView>
      </View>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : filtered.length === 0 && !error ? (
        <PanelMessage title="Chưa có bài nghe phù hợp" description="Thử đổi cấp độ hoặc quay lại sau." />
      ) : (
        <View style={styles.list}>
          {filtered.map((l) => (
            <PracticeItemCard
              key={l.id}
              title={l.title}
              badges={[l.topic ?? 'Nghe chép', readingLevelLabel(l.difficulty)]}
              meta="Nghe chép chính tả"
              ctaLabel="Bắt đầu nghe"
              onPress={() => router.push({ pathname: '/listening-lesson', params: { id: String(l.id) } })}
            />
          ))}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  intro: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  filterSection: { gap: 6 },
  filterLabel: { ...Typography.labelSm, color: Colors.outline, fontWeight: '700', letterSpacing: 0.5 },
  filterRow: { gap: 8, paddingVertical: 2 },
  list: { gap: Spacing.md },
  loader: { marginVertical: Spacing.xl },
});
