import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { FilterChip } from '../common/FilterChip';
import { ErrorBanner } from '../common/ErrorBanner';
import { ReadingArticleCard } from '../reading/ReadingArticleCard';
import { PanelMessage } from './PracticeItemCard';
import { readingService, ReadingArticleSummary } from '../../services/readingService';
import { difficultyGroup } from '../../services/vocabularyService';
import { errorMessage } from '../../services/apiClient';

export const LEVEL_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'easy', label: 'Dễ (A1-A2)' },
  { id: 'mid', label: 'Vừa (B1-B2)' },
  { id: 'hard', label: 'Khó (C1-C2)' },
];

export const ReadingPanel: React.FC<{ refreshKey: number; onLoaded: () => void }> = ({ refreshKey, onLoaded }) => {
  const router = useRouter();
  const [articles, setArticles] = useState<ReadingArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setArticles((await readingService.getArticles()).articles);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được danh sách bài đọc.'));
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

  // Chủ đề lấy từ chính dữ liệu bài đọc (backend lọc theo chuỗi chủ đề chính xác).
  const topics = useMemo(
    () => Array.from(new Set(articles.map((a) => a.topic).filter((t): t is string => !!t))),
    [articles]
  );

  const filtered = articles.filter((a) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q || a.title.toLowerCase().includes(q) || (a.topic ?? '').toLowerCase().includes(q) || (a.difficulty ?? '').toLowerCase().includes(q);
    const matchLevel = levelFilter === 'all' || difficultyGroup(a.difficulty) === levelFilter;
    const matchTopic = topicFilter === 'all' || a.topic === topicFilter;
    return matchSearch && matchLevel && matchTopic;
  });

  return (
    <>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm bài đọc, chủ đề, cấp độ..."
          placeholderTextColor={Colors.outline}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>Xoá</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>CẤP ĐỘ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {LEVEL_FILTERS.map((f) => (
            <FilterChip key={f.id} label={f.label} isActive={levelFilter === f.id} onPress={() => setLevelFilter(f.id)} />
          ))}
        </ScrollView>
      </View>

      {topics.length > 0 && (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>CHỦ ĐỀ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <FilterChip label="Tất cả chủ đề" isActive={topicFilter === 'all'} onPress={() => setTopicFilter('all')} />
            {topics.map((t) => (
              <FilterChip key={t} label={t} isActive={topicFilter === t} onPress={() => setTopicFilter(t)} />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Danh sách bài đọc</Text>
        <Text style={styles.count}>{filtered.length} bài khả dụng</Text>
      </View>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : filtered.length === 0 && !error ? (
        <PanelMessage title="Chưa có bài đọc phù hợp" description="Thử đổi bộ lọc hoặc quay lại sau." />
      ) : (
        <View style={styles.list}>
          {filtered.map((article, idx) => (
            <ReadingArticleCard
              key={article.id}
              article={article}
              isFeatured={idx === 0}
              onPress={() => router.push({ pathname: '/reading-detail', params: { id: String(article.id) } })}
            />
          ))}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    height: 48,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  searchInput: { flex: 1, height: '100%', ...Typography.bodyMd, color: Colors.onSurface },
  clearBtn: { paddingLeft: Spacing.sm },
  clearText: { ...Typography.labelSm, color: Colors.tertiary, fontWeight: '600' },
  filterSection: { gap: 6 },
  filterLabel: { ...Typography.labelSm, color: Colors.outline, fontWeight: '700', letterSpacing: 0.5 },
  filterRow: { gap: 8, paddingVertical: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.xs },
  sectionTitle: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '700' },
  count: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  list: { gap: Spacing.md },
  loader: { marginVertical: Spacing.xl },
});
