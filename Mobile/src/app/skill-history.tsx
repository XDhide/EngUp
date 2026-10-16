import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { PanelScreen } from '../components/practice/PanelScreen';
import { PanelMessage } from '../components/practice/PracticeItemCard';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { readingService, ReadingHistoryItem } from '../services/readingService';
import { listeningService, ListeningHistoryItem } from '../services/listeningService';
import { errorMessage } from '../services/apiClient';

type Row = { id: number; title: string; date: string; main: string; sub: string; good: boolean };

const toRows = {
  reading: (list: ReadingHistoryItem[]): Row[] =>
    list.map((a) => ({
      id: a.id,
      title: a.title ?? `Bài đọc #${a.article_id}`,
      date: a.submitted_at,
      main: a.score === null ? '—' : `${Math.round(a.score)}%`,
      sub: `${a.correct_count}/${a.total_count} câu đúng`,
      good: (a.score ?? 0) >= 60,
    })),
  listening: (list: ListeningHistoryItem[]): Row[] =>
    list.map((a) => ({
      id: a.id,
      title: a.title ?? `Bài nghe #${a.lesson_id}`,
      date: a.submitted_at,
      main: `${Math.round(a.accuracy_percent)}%`,
      sub: `${a.wrong_count} từ sai`,
      good: a.accuracy_percent >= 60,
    })),
};

function HistoryList({ type, refreshKey, onLoaded }: { type: 'reading' | 'listening'; refreshKey: number; onLoaded: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(type === 'reading' ? toRows.reading(await readingService.getHistory()) : toRows.listening(await listeningService.getHistory()));
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được lịch sử làm bài.'));
    } finally {
      setLoading(false);
      onLoaded();
    }
  }, [type, onLoaded]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, refreshKey])
  );

  const avg = rows.length ? Math.round(rows.reduce((t, r) => t + (parseInt(r.main, 10) || 0), 0) / rows.length) : null;

  return (
    <>
      {error && <ErrorBanner message={error} />}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
      ) : rows.length === 0 && !error ? (
        <PanelMessage title="Chưa có lượt làm bài nào" description="Hoàn thành một bài rồi nộp để điểm được lưu tại đây." />
      ) : (
        <>
          {avg !== null && (
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>ĐIỂM TRUNG BÌNH · {rows.length} LƯỢT</Text>
              <Text style={styles.summaryValue}>{avg}%</Text>
            </View>
          )}
          {rows.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={2}>{r.title}</Text>
                <Text style={styles.meta}>{new Date(r.date).toLocaleString('vi-VN')} · {r.sub}</Text>
              </View>
              <Text style={[styles.score, { color: r.good ? Colors.primary : Colors.tertiary }]}>{r.main}</Text>
            </View>
          ))}
        </>
      )}
    </>
  );
}

export default function SkillHistoryScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const type = params.type === 'listening' ? 'listening' : 'reading';
  return (
    <PanelScreen title={type === 'reading' ? 'Điểm bài đọc' : 'Điểm bài nghe'}>
      {(p) => <HistoryList type={type} {...p} />}
    </PanelScreen>
  );
}

const styles = StyleSheet.create({
  summary: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.md, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(217, 227, 246, 0.6)' },
  summaryLabel: { ...Typography.labelSm, color: Colors.outline, fontWeight: '700', letterSpacing: 0.5 },
  summaryValue: { ...Typography.titleSm, color: Colors.primary, fontWeight: '800', fontSize: 28, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.md, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(217, 227, 246, 0.6)' },
  title: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '700' },
  meta: { ...Typography.labelSm, color: Colors.onSurfaceVariant, marginTop: 4 },
  score: { ...Typography.titleSm, fontWeight: '800', fontSize: 20 },
});
