import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';
import { AppButton } from '../components/common/AppButton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { ProgressBar } from '../components/common/ProgressBar';
import { FilterChip } from '../components/common/FilterChip';
import { TopicWordItem } from '../components/vocabulary/TopicWordItem';
import {
  vocabularyService,
  VocabularyWord,
  CEFR_LEVELS,
} from '../services/vocabularyService';
import { notebookService } from '../services/notebookService';
import { errorMessage } from '../services/apiClient';

const PAGE_SIZE = 50;

export default function TopicDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const topicId = Number(params.id);
  const topicName = (params.name as string) || 'Chủ đề từ vựng';

  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [total, setTotal] = useState(0);
  const [level, setLevel] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // word_id -> notebook entry id (để bỏ lưu đúng bản ghi trên server)
  const [savedEntries, setSavedEntries] = useState<Record<number, number>>({});
  const [topicSavedCount, setTopicSavedCount] = useState(0);
  const [topicTotal, setTopicTotal] = useState(0);

  const loadSaved = useCallback(async () => {
    try {
      const { entries } = await notebookService.getEntries();
      const map: Record<number, number> = {};
      let inTopic = 0;
      entries.forEach((e) => {
        if (!(e.word_id in map)) {
          map[e.word_id] = e.id;
          if (e.word?.topic_id === topicId) inTopic += 1;
        }
      });
      setSavedEntries(map);
      setTopicSavedCount(inTopic);
    } catch {
      // Không chặn màn hình nếu chỉ lỗi phần trạng thái đã lưu.
    }
  }, [topicId]);

  const loadWords = useCallback(
    async (offset: number) => {
      const res = await vocabularyService.getWords({
        topic_id: topicId,
        difficulty: level === 'all' ? undefined : level,
        limit: PAGE_SIZE,
        offset,
      });
      setTotal(res.total);
      setWords((prev) => (offset === 0 ? res.words : [...prev, ...res.words]));
    },
    [topicId, level]
  );

  // Tổng số từ của cả chủ đề (không phụ thuộc bộ lọc cấp độ) cho thẻ tiến độ.
  useEffect(() => {
    vocabularyService
      .getWords({ topic_id: topicId, limit: 1 })
      .then((r) => setTopicTotal(r.total))
      .catch(() => {});
  }, [topicId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([loadWords(0), loadSaved()])
      .catch((e) => setError(errorMessage(e, 'Không tải được danh sách từ.')))
      .finally(() => setLoading(false));
  }, [loadWords, loadSaved]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      await loadWords(words.length);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggleSave = async (word: VocabularyWord) => {
    const entryId = savedEntries[word.id];
    try {
      if (entryId) {
        await notebookService.deleteEntry(entryId);
        setSavedEntries((prev) => {
          const next = { ...prev };
          delete next[word.id];
          return next;
        });
        setTopicSavedCount((c) => Math.max(0, c - 1));
      } else {
        const entry = await notebookService.addEntry({
          word_id: word.id,
          source_type: 'vocabulary',
          source_id: topicId,
          note: `Lưu từ chủ đề: ${topicName}`,
        });
        setSavedEntries((prev) => ({ ...prev, [word.id]: entry.id }));
        setTopicSavedCount((c) => c + 1);
      }
    } catch (e) {
      Alert.alert('Không thực hiện được', errorMessage(e));
    }
  };

  const savedRatio = topicTotal > 0 ? topicSavedCount / topicTotal : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title={topicName} showBack onBack={() => router.back()} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleGroup}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{topicName}</Text>
            <Text style={styles.topicNum}>Chủ đề #{String(topicId).padStart(2, '0')}</Text>
          </View>
          <Text style={styles.subtitle}>Chủ đề gồm {topicTotal} từ</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Đã lưu vào sổ tay</Text>
            <Text style={styles.progressValue}>
              {topicSavedCount}/{topicTotal} từ
            </Text>
          </View>

          <ProgressBar progress={savedRatio} height={6} />

          <View style={styles.progressFooter}>
            <Text style={styles.footerLabel}>Tỷ lệ đã lưu</Text>
            <Text style={styles.footerPercent}>{Math.round(savedRatio * 100)}%</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <FilterChip
            label="Tất cả"
            isActive={level === 'all'}
            onPress={() => setLevel('all')}
          />
          {CEFR_LEVELS.map((l) => (
            <FilterChip key={l} label={l} isActive={level === l} onPress={() => setLevel(l)} />
          ))}
        </ScrollView>

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.wordList}>
            {words.length === 0 && !error && (
              <Text style={styles.subtitle}>Không có từ nào ở cấp độ này.</Text>
            )}
            {words.map((word) => (
              <TopicWordItem
                key={word.id}
                word={word}
                isSaved={word.id in savedEntries}
                onToggleSave={handleToggleSave}
              />
            ))}
            {words.length < total && (
              <AppButton
                title={`Tải thêm (${words.length}/${total})`}
                variant="outline"
                loading={loadingMore}
                onPress={handleLoadMore}
              />
            )}
          </View>
        )}

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
  titleGroup: {
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.headlineLg,
    color: Colors.onSurface,
  },
  topicNum: {
    ...Typography.labelSm,
    color: Colors.secondary,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  progressCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Rounded.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 227, 246, 0.6)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  progressValue: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
  },
  progressFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  footerLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  footerPercent: {
    ...Typography.labelSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  filterRow: {
    gap: 8,
    paddingVertical: 2,
  },
  wordList: {
    gap: Spacing.sm,
  },
  loader: {
    marginVertical: Spacing.xl,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
