import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';
import { AppButton } from '../components/common/AppButton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { FilterChip } from '../components/common/FilterChip';
import { apiRequest, errorMessage } from '../services/apiClient';
import { API_VOCABULARY_TOPICS } from '../services/api';
import { CEFR_LEVELS, vocabularyService, VocabularyTopic } from '../services/vocabularyService';
import { readingService } from '../services/readingService';
import { listeningService } from '../services/listeningService';
import { learningPathService, PathItemType, PATH_ITEM_LABELS } from '../services/learningPathService';

interface Pick {
  item_type: PathItemType;
  item_id: number;
  title: string;
  subtitle: string | null;
}

const TYPES: PathItemType[] = ['word', 'reading', 'listening'];

export default function LearningPathCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const editId = params.id ? Number(params.id) : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('');
  const [items, setItems] = useState<Pick[]>([]);
  const [tab, setTab] = useState<PathItemType>('word');
  const [topics, setTopics] = useState<VocabularyTopic[]>([]);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [source, setSource] = useState<Pick[]>([]);
  const [search, setSearch] = useState('');
  const [loadedKey, setLoadedKey] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ topics: VocabularyTopic[] }>(API_VOCABULARY_TOPICS).then((r) => setTopics(r.topics ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    learningPathService.detail(editId).then((p) => {
      setTitle(p.title);
      setDescription(p.description ?? '');
      setLevel(p.level ?? '');
      setItems(p.items.filter((i) => !i.missing).map((i) => ({ item_type: i.item_type, item_id: i.item_id, title: i.title ?? '', subtitle: i.subtitle })));
    }).catch((e) => setError(errorMessage(e))).finally(() => setLoadingEdit(false));
  }, [editId]);

  useEffect(() => {
    let alive = true;
    const key = `${tab}:${topicId ?? ''}`;
    const load = async (): Promise<Pick[]> => {
      if (tab === 'word') {
        const r = await vocabularyService.getWords({ limit: 200, ...(topicId ? { topic_id: topicId } : {}) });
        return r.words.map((w) => ({ item_type: 'word' as const, item_id: w.id, title: w.word, subtitle: w.meaning }));
      }
      if (tab === 'reading') {
        const r = await readingService.getArticles();
        return r.articles.map((a) => ({ item_type: 'reading' as const, item_id: a.id, title: a.title, subtitle: a.topic ?? null }));
      }
      const r = await listeningService.getLessons();
      return r.lessons.map((l) => ({ item_type: 'listening' as const, item_id: l.id, title: l.title, subtitle: l.topic ?? null }));
    };
    load()
      .then((list) => { if (alive) setSource(list); })
      .catch((e) => { if (alive) setError(errorMessage(e)); })
      .finally(() => { if (alive) setLoadedKey(key); });
    return () => { alive = false; };
  }, [tab, topicId]);

  const loadingSource = loadedKey !== `${tab}:${topicId ?? ''}`;
  const picked = useMemo(() => new Set(items.map((i) => `${i.item_type}:${i.item_id}`)), [items]);
  const visible = source.filter((s) => !search.trim() || `${s.title} ${s.subtitle ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()));

  const addMany = (list: Pick[]) => setItems((cur) => {
    const keys = new Set(cur.map((i) => `${i.item_type}:${i.item_id}`));
    return [...cur, ...list.filter((s) => !keys.has(`${s.item_type}:${s.item_id}`))];
  });
  const removeAt = (idx: number) => setItems((cur) => cur.filter((_, i) => i !== idx));
  const move = (idx: number, dir: number) => setItems((cur) => {
    const next = [...cur];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return cur;
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  });

  const submit = async () => {
    setError('');
    if (!title.trim()) { setError('Hãy nhập tên lộ trình.'); return; }
    if (!items.length) { setError('Lộ trình cần ít nhất 1 từ vựng hoặc bài học.'); return; }
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        level: level || null,
        items: items.map((i) => ({ item_type: i.item_type, item_id: i.item_id })),
      };
      const saved = editId ? await learningPathService.update(editId, payload) : await learningPathService.create(payload);
      Alert.alert(
        saved.is_approved ? 'Đã lưu' : 'Đã gửi duyệt',
        saved.is_approved ? 'Lộ trình đã được lưu.' : 'Lộ trình của bạn đang chờ quản trị viên duyệt. Bạn sẽ nhận thông báo khi có kết quả.',
        [{ text: 'OK', onPress: () => router.replace({ pathname: '/learning-path-detail', params: { id: String(saved.id) } }) }]
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loadingEdit) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AppHeader title="Sửa lộ trình" showBack />
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title={editId ? 'Sửa lộ trình' : 'Tạo lộ trình'} showBack />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 60 + insets.bottom }]} keyboardShouldPersistTaps="handled">
          {error ? <ErrorBanner message={error} /> : null}
          <Text style={styles.note}>Lộ trình của bạn sẽ được quản trị viên kiểm duyệt trước khi mọi người nhìn thấy.</Text>
          <Text style={styles.label}>Tên lộ trình *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} maxLength={255} placeholder="vd: Từ vựng du lịch cơ bản" placeholderTextColor={Colors.outline} />
          <Text style={styles.label}>Mô tả</Text>
          <TextInput style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} multiline maxLength={3000} placeholderTextColor={Colors.outline} />
          <Text style={styles.label}>Cấp độ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CEFR_LEVELS.map((l) => <FilterChip key={l} label={l} isActive={level === l} onPress={() => setLevel(level === l ? '' : l)} />)}
          </ScrollView>

          <Text style={styles.section}>Nội dung đã chọn ({items.length})</Text>
          {!items.length && <Text style={styles.note}>Chưa chọn mục nào. Hãy chọn từ danh sách bên dưới.</Text>}
          {items.map((i, idx) => (
            <View key={`${i.item_type}:${i.item_id}`} style={styles.pickRow}>
              <Text style={styles.pickIndex}>{idx + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickType}>{PATH_ITEM_LABELS[i.item_type]}</Text>
                <Text style={styles.pickTitle} numberOfLines={1}>{i.title}</Text>
              </View>
              <TouchableOpacity onPress={() => move(idx, -1)} hitSlop={8}><Text style={styles.act}>↑</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => move(idx, 1)} hitSlop={8}><Text style={styles.act}>↓</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => removeAt(idx)} hitSlop={8}><Text style={[styles.act, { color: Colors.error }]}>✕</Text></TouchableOpacity>
            </View>
          ))}

          <Text style={styles.section}>Thêm nội dung</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {TYPES.map((t) => <FilterChip key={t} label={PATH_ITEM_LABELS[t]} isActive={tab === t} onPress={() => { setTab(t); setSearch(''); }} />)}
          </View>
          {tab === 'word' && topics.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <FilterChip label="Tất cả chủ đề" isActive={topicId === null} onPress={() => setTopicId(null)} />
              {topics.map((t) => <FilterChip key={t.id} label={t.name} isActive={topicId === t.id} onPress={() => setTopicId(t.id)} />)}
            </ScrollView>
          )}
          <TextInput style={styles.input} value={search} onChangeText={setSearch} placeholder="Tìm trong danh sách..." placeholderTextColor={Colors.outline} />
          <AppButton title={`Thêm tất cả (${visible.length})`} variant="outline" disabled={!visible.length} onPress={() => addMany(visible)} />
          {loadingSource && <ActivityIndicator color={Colors.primary} />}
          {!loadingSource && !visible.length && <Text style={styles.note}>Không có mục phù hợp.</Text>}
          {visible.slice(0, 100).map((s) => {
            const done = picked.has(`${s.item_type}:${s.item_id}`);
            return (
              <TouchableOpacity key={s.item_id} style={styles.srcRow} disabled={done} onPress={() => addMany([s])} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickTitle} numberOfLines={1}>{s.title}</Text>
                  {s.subtitle ? <Text style={styles.pickType} numberOfLines={1}>{s.subtitle}</Text> : null}
                </View>
                <Text style={[styles.act, done && { color: Colors.outline }]}>{done ? 'Đã thêm' : '+ Thêm'}</Text>
              </TouchableOpacity>
            );
          })}
          {visible.length > 100 && <Text style={styles.note}>Chỉ hiện 100 mục đầu, hãy dùng ô tìm kiếm hoặc lọc chủ đề.</Text>}

          <AppButton title={editId ? 'Lưu thay đổi' : 'Gửi duyệt lộ trình'} onPress={submit} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.margin, gap: Spacing.sm },
  note: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  label: { ...Typography.labelMd, color: Colors.onSurface, fontWeight: '700' },
  section: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '800', marginTop: Spacing.md },
  input: { borderRadius: Rounded.md, backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1, borderColor: Colors.surfaceContainerHighest, paddingHorizontal: Spacing.md, paddingVertical: 12, color: Colors.onSurface },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceContainerLow, borderRadius: Rounded.md, padding: Spacing.sm },
  pickIndex: { width: 22, textAlign: 'center', color: Colors.outline, fontWeight: '700' },
  pickType: { ...Typography.labelSm, color: Colors.outline },
  pickTitle: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '600' },
  act: { ...Typography.labelMd, color: Colors.primary, fontWeight: '800', paddingHorizontal: 6 },
  srcRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceContainerHighest },
});
