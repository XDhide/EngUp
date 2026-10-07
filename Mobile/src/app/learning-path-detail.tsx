import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';
import { AppButton } from '../components/common/AppButton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { errorMessage } from '../services/apiClient';
import {
  learningPathService, LearningPathDetail, PathItem, PATH_ITEM_LABELS, PATH_STATUS_LABELS,
} from '../services/learningPathService';

export default function LearningPathDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const pathId = Number(params.id);
  const [path, setPath] = useState<LearningPathDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setPath(await learningPathService.detail(pathId));
    } catch (e) {
      setError(errorMessage(e, 'Không tải được lộ trình.'));
    } finally {
      setLoading(false);
    }
  }, [pathId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const openItem = (item: PathItem) => {
    if (item.missing) return;
    if (item.item_type === 'reading') router.push({ pathname: '/reading-detail', params: { id: String(item.item_id) } });
    else if (item.item_type === 'listening') router.push({ pathname: '/listening-lesson', params: { id: String(item.item_id) } });
    else if (path?.enrolled) router.push('/flashcard');
  };

  const confirmDelete = () => Alert.alert('Xóa lộ trình', 'Bạn có chắc muốn xóa lộ trình này?', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Xóa', style: 'destructive', onPress: async () => {
      try { await learningPathService.remove(pathId); router.back(); } catch (e) { setError(errorMessage(e)); }
    } },
  ]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AppHeader title="Lộ trình" showBack />
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const p = path;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Lộ trình" showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
        {error ? <ErrorBanner message={error} /> : null}
        {p && (
          <>
            <Text style={styles.title}>{p.title}</Text>
            <Text style={styles.meta}>
              {p.level ? `${p.level} · ` : ''}{p.is_official ? 'Lộ trình chính thức' : `Bởi ${p.creator_name ?? 'người dùng'}`}
            </Text>
            {p.description ? <Text style={styles.desc}>{p.description}</Text> : null}
            {!p.is_approved && (
              <Text style={[styles.badge, p.status === 'rejected' && { color: Colors.error }]}>
                {PATH_STATUS_LABELS[p.status]}{p.status === 'rejected' && p.reject_reason ? `: ${p.reject_reason}` : ''}
              </Text>
            )}

            <View style={styles.progressCard}>
              <Text style={styles.grade}>{p.progress.grade.label}</Text>
              <View style={styles.barBg}><View style={[styles.barFill, { width: `${p.progress.completion_percent}%` }]} /></View>
              <View style={styles.statsRow}>
                <View style={styles.stat}><Text style={styles.statValue}>{p.progress.completion_percent}%</Text><Text style={styles.statLabel}>Hoàn thành ({p.progress.done}/{p.progress.total})</Text></View>
                <View style={styles.stat}><Text style={styles.statValue}>{p.progress.mastery_percent}%</Text><Text style={styles.statLabel}>Mức thành thạo</Text></View>
              </View>
              <Text style={styles.statLabel}>
                Từ {p.progress.by_type.word.done}/{p.progress.by_type.word.total} · Bài đọc {p.progress.by_type.reading.done}/{p.progress.by_type.reading.total} · Bài nghe {p.progress.by_type.listening.done}/{p.progress.by_type.listening.total}
              </Text>
            </View>

            {p.is_approved && (
              p.enrolled
                ? <AppButton title="Rời lộ trình" variant="outline" loading={busy} onPress={() => run(() => learningPathService.leave(pathId))} />
                : <AppButton title="Tham gia lộ trình" loading={busy} onPress={() => run(() => learningPathService.enroll(pathId))} />
            )}
            {p.enrolled && p.progress.by_type.word.total > 0 && (
              <AppButton title="Ôn các từ trong lộ trình" variant="outline" onPress={() => router.push('/flashcard')} />
            )}

            <Text style={styles.section}>Nội dung ({p.items.length})</Text>
            {p.items.map((item, idx) => (
              <TouchableOpacity key={`${item.item_type}-${item.item_id}`} style={styles.item} activeOpacity={0.8} onPress={() => openItem(item)} disabled={item.missing}>
                <Text style={styles.itemIndex}>{idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemType}>{PATH_ITEM_LABELS[item.item_type]}</Text>
                  <Text style={styles.itemTitle} numberOfLines={2}>{item.missing ? 'Nội dung đã bị xóa' : item.title}</Text>
                  {item.subtitle ? <Text style={styles.itemSub} numberOfLines={1}>{item.subtitle}</Text> : null}
                </View>
                <Text style={[styles.itemState, item.done && { color: Colors.primary }]}>
                  {item.missing ? '' : item.done ? (item.best_score != null ? `✓ ${Math.round(item.best_score)}%` : '✓ Đã học') : 'Chưa học'}
                </Text>
              </TouchableOpacity>
            ))}

            {(p.can_edit || p.can_delete) && (
              <View style={styles.owner}>
                {p.can_edit && <AppButton title="Sửa lộ trình" variant="outline" onPress={() => router.push({ pathname: '/learning-path-create', params: { id: String(p.id) } })} />}
                {p.can_delete && <AppButton title="Xóa lộ trình" variant="outline" onPress={confirmDelete} />}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.margin, gap: Spacing.md },
  title: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '800', fontSize: 22 },
  meta: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  desc: { ...Typography.bodyMd, color: Colors.onSurface },
  badge: { ...Typography.labelMd, color: Colors.primary, fontWeight: '800' },
  progressCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.lg, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceContainerHighest },
  grade: { ...Typography.titleSm, color: Colors.primary, fontWeight: '800' },
  barBg: { height: 10, borderRadius: 5, backgroundColor: Colors.surfaceContainerHigh, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  stat: { flex: 1 },
  statValue: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '800' },
  statLabel: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  section: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '800', marginTop: Spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceContainerHighest },
  itemIndex: { width: 24, textAlign: 'center', color: Colors.outline, fontWeight: '700' },
  itemType: { ...Typography.labelSm, color: Colors.outline },
  itemTitle: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '700' },
  itemSub: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  itemState: { ...Typography.labelMd, color: Colors.outline, fontWeight: '700' },
  owner: { gap: Spacing.sm, marginTop: Spacing.md },
});
