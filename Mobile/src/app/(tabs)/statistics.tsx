import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from '../../components/common/AppHeader';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { FilterChip } from '../../components/common/FilterChip';
import { ProgressBar } from '../../components/common/ProgressBar';
import { StatTile } from '../../components/stats/StatTile';
import { BarChart, BarDatum } from '../../components/stats/BarChart';
import { statsService, StatsOverview, ProgressTimelineItem, StatsRange } from '../../services/statsService';
import { errorMessage } from '../../services/apiClient';

const RANGES: Array<{ id: StatsRange; label: string }> = [
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: 'all', label: 'Tất cả' },
];

type Metric = 'minutes' | 'words';

const shortDate = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

// Quá nhiều ngày thì gộp theo tuần để biểu đồ vẫn đọc được.
function toBars(timeline: ProgressTimelineItem[], metric: Metric): BarDatum[] {
  const pick = (t: ProgressTimelineItem) => (metric === 'minutes' ? t.minutes_studied : t.words_reviewed);
  if (timeline.length <= 31) return timeline.map((t) => ({ label: shortDate(t.date), value: pick(t) }));
  const bars: BarDatum[] = [];
  for (let i = 0; i < timeline.length; i += 7) {
    const chunk = timeline.slice(i, i + 7);
    bars.push({ label: shortDate(chunk[0].date), value: chunk.reduce((sum, t) => sum + pick(t), 0) });
  }
  return bars;
}

export default function StatisticsScreen() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [timeline, setTimeline] = useState<ProgressTimelineItem[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [range, setRange] = useState<StatsRange>('7d');
  const [metric, setMetric] = useState<Metric>('minutes');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [ov, tl, today] = await Promise.allSettled([
      statsService.getOverview(),
      statsService.getProgress(range),
      statsService.getProgress('7d'),
    ]);
    if (ov.status === 'fulfilled') setOverview(ov.value);
    if (tl.status === 'fulfilled') setTimeline(tl.value.timeline);
    if (today.status === 'fulfilled') {
      const last = today.value.timeline[today.value.timeline.length - 1];
      setTodayMinutes(last ? last.minutes_studied : 0);
    }
    const failed = [ov, tl, today].find((r) => r.status === 'rejected');
    setError(failed && failed.status === 'rejected' ? errorMessage(failed.reason, 'Không tải được thống kê.') : null);
    setLoading(false);
    setRefreshing(false);
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totals = useMemo(
    () => ({
      minutes: timeline.reduce((s, t) => s + t.minutes_studied, 0),
      words: timeline.reduce((s, t) => s + t.words_reviewed, 0),
      activeDays: timeline.filter((t) => t.minutes_studied > 0 || t.words_reviewed > 0).length,
    }),
    [timeline]
  );

  const target = user?.daily_target_minutes ?? 15;
  const bars = useMemo(() => toBars(timeline, metric), [timeline, metric]);
  const pct = (v: number | null) => (v === null ? 'Chưa có' : `${Math.round(v * 10) / 10}`);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Thống Kê" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Thống kê học tập</Text>
          <Text style={styles.subtitle}>Theo dõi nhịp học và mức độ ghi nhớ của bạn.</Text>
        </View>

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            <View style={styles.streakCard}>
              <Text style={styles.streakLabel}>CHUỖI HỌC TẬP</Text>
              <Text style={styles.streakValue}>{overview?.current_streak ?? 0} ngày liên tiếp</Text>
              <Text style={styles.streakSub}>Kỷ lục của bạn: {overview?.longest_streak ?? 0} ngày</Text>
            </View>

            <View style={styles.todayCard}>
              <View style={styles.todayRow}>
                <Text style={styles.todayTitle}>
                  Hôm nay: {todayMinutes}/{target} phút
                </Text>
                <Text style={styles.todayPct}>{target > 0 ? Math.min(100, Math.round((todayMinutes / target) * 100)) : 0}%</Text>
              </View>
              <ProgressBar progress={target > 0 ? todayMinutes / target : 0} height={6} />
            </View>

            <View style={styles.grid}>
              <StatTile label="TỪ ĐÃ HỌC" value={String(overview?.total_words_learned ?? 0)} hint="từ vựng trong lộ trình SRS" />
              <StatTile label="LƯỢT ÔN TẬP" value={String(overview?.total_reviews ?? 0)} hint="tổng số lần ôn thẻ" />
              <StatTile label="ĐỌC HIỂU TB" value={pct(overview?.reading_avg_score ?? null)} hint="điểm trung bình" />
              <StatTile label="NGHE CHÉP TB" value={overview?.listening_avg_accuracy == null ? 'Chưa có' : `${pct(overview.listening_avg_accuracy)}%`} hint="độ chính xác" />
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>Tiến độ theo ngày</Text>
              </View>

              <View style={styles.chipRow}>
                {RANGES.map((r) => (
                  <FilterChip key={r.id} label={r.label} isActive={range === r.id} onPress={() => setRange(r.id)} />
                ))}
              </View>
              <View style={styles.chipRow}>
                <FilterChip label="Số phút học" isActive={metric === 'minutes'} onPress={() => setMetric('minutes')} />
                <FilterChip label="Từ đã ôn" isActive={metric === 'words'} onPress={() => setMetric('words')} />
              </View>

              {bars.length === 0 ? (
                <Text style={styles.subtitle}>Chưa có dữ liệu trong khoảng thời gian này.</Text>
              ) : (
                <BarChart data={bars} unit={metric === 'minutes' ? 'phút' : 'từ'} />
              )}

              <View style={styles.totalsRow}>
                <View style={styles.totalCell}>
                  <Text style={styles.totalValue}>{totals.minutes}</Text>
                  <Text style={styles.totalLabel}>phút học</Text>
                </View>
                <View style={styles.totalCell}>
                  <Text style={styles.totalValue}>{totals.words}</Text>
                  <Text style={styles.totalLabel}>từ đã ôn</Text>
                </View>
                <View style={styles.totalCell}>
                  <Text style={styles.totalValue}>{totals.activeDays}</Text>
                  <Text style={styles.totalLabel}>ngày học</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingHorizontal: Spacing.margin, paddingVertical: Spacing.md, gap: Spacing.md },
  titleGroup: { gap: 2 },
  title: { ...Typography.headlineLg, color: Colors.onSurface, fontWeight: '700' },
  subtitle: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  loader: { marginVertical: Spacing.xl },
  streakCard: { backgroundColor: Colors.primaryContainer, borderRadius: Rounded.xl, padding: Spacing.md + 4, gap: 4 },
  streakLabel: { ...Typography.labelSm, color: Colors.onPrimaryContainer, fontWeight: '700', letterSpacing: 1 },
  streakValue: { ...Typography.headlineMd, color: Colors.onPrimary, fontWeight: '800' },
  streakSub: { ...Typography.bodyMd, color: Colors.onPrimary },
  todayCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.xl, padding: Spacing.md, gap: Spacing.sm },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  todayTitle: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '700' },
  todayPct: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chartCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.xl, padding: Spacing.md, gap: Spacing.sm },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '700' },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.sm },
  totalCell: { alignItems: 'center', flex: 1 },
  totalValue: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '800' },
  totalLabel: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  bottomSpacer: { height: Spacing.xl },
});
