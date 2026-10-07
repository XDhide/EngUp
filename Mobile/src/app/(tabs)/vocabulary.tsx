import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { AppHeader } from '../../components/common/AppHeader';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { TopicCardItem } from '../../components/vocabulary/TopicCardItem';
import { vocabularyService, VocabularyTopic } from '../../services/vocabularyService';
import { errorMessage } from '../../services/apiClient';

export default function VocabularyScreen() {
  const router = useRouter();

  const [topics, setTopics] = useState<VocabularyTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = useCallback(async () => {
    try {
      const res = await vocabularyService.getTopics();
      setTopics(res.topics);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được danh sách chủ đề.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTopics();
  };

  // Màn này luôn ở mục "Chủ đề"; "Từ mới" và "Sổ tay" chuyển sang màn riêng.
  const activeTab = 'topics' as 'topics' | 'new-words' | 'notebook';

  const handleTabChange = (tab: 'topics' | 'new-words' | 'notebook') => {
    if (tab === 'new-words') router.push('/daily-words');
    else if (tab === 'notebook') router.push('/(tabs)/notebook');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Từ Vựng" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Title Section */}
        <View style={styles.headerTitleGroup}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Từ vựng</Text>
            <Text style={styles.topicsCount}>{topics.length} chủ đề</Text>
          </View>
          <Text style={styles.subtitle}>
            Khám phá các chủ đề từ vựng thông dụng theo lộ trình ghi nhớ ngắt quãng.
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'topics' && styles.tabBtnActive]}
            onPress={() => handleTabChange('topics')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'topics' && styles.tabTextActive]}>
              Chủ đề
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'new-words' && styles.tabBtnActive]}
            onPress={() => handleTabChange('new-words')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'new-words' && styles.tabTextActive]}>
              Từ mới
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'notebook' && styles.tabBtnActive]}
            onPress={() => handleTabChange('notebook')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'notebook' && styles.tabTextActive]}>
              Sổ tay
            </Text>
          </TouchableOpacity>
        </View>

        {error && <ErrorBanner message={error} />}

        {/* Topic List */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.topicList}>
            {topics.length === 0 && !error && (
              <Text style={styles.subtitle}>Chưa có chủ đề nào.</Text>
            )}
            {topics.map((topic, index) => (
              <TopicCardItem
                key={topic.id}
                topic={topic}
                index={index}
                onPress={() =>
                  router.push({
                    pathname: '/topic-detail',
                    params: { id: String(topic.id), name: topic.name },
                  })
                }
              />
            ))}
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
  headerTitleGroup: {
    gap: 4,
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
  topicsCount: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.md,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    height: 38,
    borderRadius: Rounded.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.onSurface,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  topicList: {
    gap: Spacing.md,
  },
  loader: {
    marginVertical: Spacing.xl,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
