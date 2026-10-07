import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Modal, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';
import { AppButton } from '../components/common/AppButton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { FilterChip } from '../components/common/FilterChip';
import { errorMessage } from '../services/apiClient';
import {
  notesService, UserNote, NoteColor, NoteRefType, NOTE_COLORS, REF_LABELS,
} from '../services/notesService';

const colorBg = (c: NoteColor | null) => NOTE_COLORS.find((x) => x.key === c)?.bg ?? Colors.surfaceContainerLowest;
const FILTERS: (NoteRefType | 'all')[] = ['all', 'none', 'word', 'reading', 'listening', 'test'];

interface Draft {
  id?: number;
  title: string;
  content: string;
  color: NoteColor | null;
  is_pinned: boolean;
  ref_type: NoteRefType;
  ref_id: number | null;
  ref_label: string | null;
}
const emptyDraft: Draft = { title: '', content: '', color: 'yellow', is_pinned: false, ref_type: 'none', ref_id: null, ref_label: null };

export default function NotesScreen() {
  const params = useLocalSearchParams<{ ref_type?: string; ref_id?: string; ref_label?: string }>();
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<NoteRefType | 'all'>('all');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftError, setDraftError] = useState('');
  const opened = useRef(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const r = await notesService.list({ q: query, ref_type: filter });
      setNotes(r.notes);
    } catch (e) {
      setError(errorMessage(e, 'Không tải được ghi chú.'));
    } finally {
      setLoading(false);
    }
  }, [query, filter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (opened.current || !params.ref_type || params.ref_type === 'none') return;
    opened.current = true;
    setDraft({
      ...emptyDraft,
      ref_type: params.ref_type as NoteRefType,
      ref_id: params.ref_id ? Number(params.ref_id) : null,
      ref_label: params.ref_label ?? null,
    });
  }, [params.ref_type, params.ref_id, params.ref_label]);

  const openNew = () => { setDraftError(''); setDraft({ ...emptyDraft }); };
  const openEdit = (n: UserNote) => {
    setDraftError('');
    setDraft({ id: n.id, title: n.title ?? '', content: n.content, color: n.color, is_pinned: n.is_pinned, ref_type: n.ref_type, ref_id: n.ref_id, ref_label: n.ref_label });
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.content.trim()) { setDraftError('Hãy nhập nội dung ghi chú.'); return; }
    setSaving(true);
    setDraftError('');
    try {
      const body = {
        title: draft.title.trim() || null,
        content: draft.content.trim(),
        color: draft.color,
        is_pinned: draft.is_pinned,
        ref_type: draft.ref_type,
        ref_id: draft.ref_id,
        ref_label: draft.ref_label,
      };
      if (draft.id) await notesService.update(draft.id, body);
      else await notesService.create(body);
      setDraft(null);
      await load();
    } catch (e) {
      setDraftError(errorMessage(e, 'Không lưu được ghi chú.'));
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (n: UserNote) => {
    try { await notesService.update(n.id, { is_pinned: !n.is_pinned }); await load(); }
    catch (e) { setError(errorMessage(e)); }
  };

  const confirmDelete = (n: UserNote) => {
    Alert.alert('Xóa ghi chú', 'Bạn có chắc muốn xóa ghi chú này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try { await notesService.remove(n.id); await load(); } catch (e) { setError(errorMessage(e)); }
      } },
    ]);
  };

  const renderNote = ({ item }: { item: UserNote }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: colorBg(item.color) }]} onPress={() => openEdit(item)} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.is_pinned ? '📌 ' : ''}{item.title || 'Ghi chú'}</Text>
        <TouchableOpacity onPress={() => togglePin(item)} hitSlop={8}><Text style={styles.cardAction}>{item.is_pinned ? 'Bỏ ghim' : 'Ghim'}</Text></TouchableOpacity>
      </View>
      <Text style={styles.cardBody} numberOfLines={5}>{item.content}</Text>
      <View style={styles.cardBottom}>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {item.ref_type !== 'none' ? `${REF_LABELS[item.ref_type]}${item.ref_label ? `: ${item.ref_label}` : ''}` : new Date(item.updated_at).toLocaleDateString('vi-VN')}
        </Text>
        <TouchableOpacity onPress={() => confirmDelete(item)} hitSlop={8}><Text style={[styles.cardAction, { color: Colors.error }]}>Xóa</Text></TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Ghi chú của tôi" showBack />
      <View style={styles.toolbar}>
        <TextInput style={styles.search} placeholder="Tìm trong ghi chú..." placeholderTextColor={Colors.outline} value={query} onChangeText={setQuery} returnKeyType="search" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <FilterChip key={f} label={f === 'all' ? 'Tất cả' : REF_LABELS[f]} isActive={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>
      {error ? <ErrorBanner message={error} style={{ marginHorizontal: Spacing.margin }} /> : null}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(n) => String(n.id)}
          renderItem={renderNote}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{query || filter !== 'all' ? 'Không có ghi chú phù hợp.' : 'Chưa có ghi chú nào.\nBấm “+ Ghi chú” để thêm ghi chú đầu tiên.'}</Text>}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={openNew} activeOpacity={0.85}><Text style={styles.fabText}>+ Ghi chú</Text></TouchableOpacity>

      <Modal visible={!!draft} animationType="slide" transparent onRequestClose={() => setDraft(null)}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{draft?.id ? 'Sửa ghi chú' : 'Ghi chú mới'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: Spacing.sm }}>
              {draftError ? <ErrorBanner message={draftError} /> : null}
              {draft && draft.ref_type !== 'none' && (
                <Text style={styles.refTag}>Gắn với {REF_LABELS[draft.ref_type].toLowerCase()}{draft.ref_label ? `: ${draft.ref_label}` : ''}</Text>
              )}
              <TextInput style={styles.input} placeholder="Tiêu đề (không bắt buộc)" placeholderTextColor={Colors.outline} maxLength={150} value={draft?.title ?? ''} onChangeText={(t) => setDraft((d) => d && { ...d, title: t })} />
              <TextInput style={[styles.input, styles.textarea]} placeholder="Nội dung ghi chú..." placeholderTextColor={Colors.outline} multiline maxLength={5000} textAlignVertical="top" value={draft?.content ?? ''} onChangeText={(t) => setDraft((d) => d && { ...d, content: t })} />
              <View style={styles.colors}>
                {NOTE_COLORS.map((c) => (
                  <TouchableOpacity key={c.key} onPress={() => setDraft((d) => d && { ...d, color: c.key })} style={[styles.swatch, { backgroundColor: c.bg }, draft?.color === c.key && styles.swatchActive]} accessibilityLabel={c.label} />
                ))}
              </View>
              <TouchableOpacity onPress={() => setDraft((d) => d && { ...d, is_pinned: !d.is_pinned })} style={styles.pinRow}>
                <Text style={styles.pinText}>{draft?.is_pinned ? '☑' : '☐'} Ghim lên đầu danh sách</Text>
              </TouchableOpacity>
            </ScrollView>
            <View style={styles.sheetActions}>
              <AppButton title="Hủy" variant="outline" onPress={() => setDraft(null)} disabled={saving} style={{ flex: 1 }} />
              <AppButton title="Lưu" onPress={save} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  toolbar: { paddingHorizontal: Spacing.margin, gap: Spacing.sm, paddingTop: Spacing.sm },
  search: { height: 44, borderRadius: Rounded.md, backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1, borderColor: Colors.surfaceContainerHighest, paddingHorizontal: Spacing.md, color: Colors.onSurface },
  filters: { gap: 8, paddingVertical: 4 },
  list: { padding: Spacing.margin, gap: Spacing.sm, paddingBottom: 120 },
  empty: { textAlign: 'center', color: Colors.onSurfaceVariant, marginTop: 48, lineHeight: 22 },
  card: { borderRadius: Rounded.lg, padding: Spacing.md, gap: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '700', flex: 1 },
  cardBody: { ...Typography.bodyMd, color: Colors.onSurface },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardMeta: { ...Typography.labelSm, color: Colors.onSurfaceVariant, flex: 1 },
  cardAction: { ...Typography.labelMd, color: Colors.primary, fontWeight: '700' },
  fab: { position: 'absolute', right: Spacing.margin, bottom: 28, backgroundColor: Colors.primary, borderRadius: Rounded.full, paddingHorizontal: 20, height: 52, justifyContent: 'center', elevation: 4 },
  fabText: { color: Colors.onPrimary, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.margin, gap: Spacing.sm, maxHeight: '90%' },
  sheetTitle: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '800' },
  input: { borderRadius: Rounded.md, backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1, borderColor: Colors.surfaceContainerHighest, paddingHorizontal: Spacing.md, paddingVertical: 12, color: Colors.onSurface },
  textarea: { minHeight: 140 },
  colors: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  swatchActive: { borderWidth: 3, borderColor: Colors.primary },
  pinRow: { paddingVertical: 6 },
  pinText: { ...Typography.bodyMd, color: Colors.onSurface },
  refTag: { ...Typography.labelSm, color: Colors.primary, fontWeight: '700' },
  sheetActions: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.sm },
});
