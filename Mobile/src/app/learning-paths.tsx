import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { FilterChip } from '../components/common/FilterChip';
import { errorMessage } from '../services/apiClient';
import { learningPathService, LearningPathSummary, PATH_STATUS_LABELS } from '../services/learningPathService';

type Scope = 'discover' | 'enrolled' | 'mine';
const TABS: { key: Scope; label: string }[] = [
  { key: 'discover', label: 'Khám phá' },
  { key: 'enrolled', label: 'Đang học' },
  { key: 'mine', label: 'Của tôi' },
];

export default function LearningPathsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<Scope>('discover');
  const [paths, setPaths] = useState<LearningPathSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (s: Scope) => {
    setLoading(true);
    setError('');
    try {
      setPaths(await learningPathService.list(s));
    } catch (e) {
      setError(errorMessage(e, 'Không tải được lộ trình.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(scope); }, [load, scope]));

  const renderItem = ({ item }: { item: LearningPathSummary }) => {
    const pct = item.progress?.completion_percent ?? 0;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/learning-path-detail', params: { id: String(item.id) } })}
      >
        <View style={styles.cardTop}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          {item.level ? <Text style={styles.level}>{item.level}</Text> : null}
        </View>
        {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
        <Text style={styles.meta}>
          {item.item_counts.word} từ · {item.item_counts.reading} bài đọc · {item.item_counts.listening} bài nghe
        </Text>
        <Text style={styles.meta}>{item.is_official ? 'Lộ trình chính thức' : `Bởi ${item.creator_name ?? 'người dùng'}`}</Text>
        {scope === 'mine' && (
          <Text style={[styles.status, item.status === 'rejected' && { color: Colors.error }]}>
            {PATH_STATUS_LABELS[item.status]}{item.status === 'rejected' && item.reject_reason ? `: ${item.reject_reason}` : ''}
          </Text>
        )}
        {item.progress && (
          <View style={{ gap: 4 }}>
            <View style={styles.barBg}><View style={[styles.barFill, { width: `${pct}%` }]} /></View>
            <Text style={styles.meta}>Hoàn thành {pct}% · {item.progress.grade.label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Lộ trình học" showBack />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={{ flexGrow: 0 }}>
        {TABS.map((t) => <FilterChip key={t.key} label={t.label} isActive={scope === t.key} onPress={() => setScope(t.key)} />)}
      </ScrollView>
      {error ? <ErrorBanner message={error} style={{ marginHorizontal: Spacing.margin }} /> : null}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={paths}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: 120 + insets.bottom }]}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {scope === 'discover' ? 'Chưa có lộ trình nào.' : scope === 'enrolled' ? 'Bạn chưa tham gia lộ trình nào.' : 'Bạn chưa tạo lộ trình nào.'}
            </Text>
          }
        />
      )}
      <TouchableOpacity style={[styles.fab, { bottom: 24 + insets.bottom }]} onPress={() => router.push('/learning-path-create')} activeOpacity={0.85}>
        <Text style={styles.fabText}>+ Tạo lộ trình</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  tabs: { paddingHorizontal: Spacing.margin, paddingVertical: Spacing.sm, gap: 8 },
  list: { padding: Spacing.margin, gap: Spacing.sm },
  empty: { textAlign: 'center', color: Colors.onSurfaceVariant, marginTop: 48 },
  card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.lg, padding: Spacing.md, gap: 6, borderWidth: 1, borderColor: Colors.surfaceContainerHighest },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  title: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '800', flex: 1 },
  level: { ...Typography.labelMd, color: Colors.primary, fontWeight: '800' },
  desc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  meta: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  status: { ...Typography.labelMd, color: Colors.primary, fontWeight: '700' },
  barBg: { height: 8, borderRadius: 4, backgroundColor: Colors.surfaceContainerHigh, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  fab: { position: 'absolute', right: Spacing.margin, backgroundColor: Colors.primary, borderRadius: Rounded.full, paddingHorizontal: 20, height: 52, justifyContent: 'center', elevation: 4 },
  fabText: { color: Colors.onPrimary, fontWeight: '800' },
});
