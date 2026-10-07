import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Rounded } from '../constants/theme';
import { AppHeader } from '../components/common/AppHeader';
import { AppButton } from '../components/common/AppButton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { FilterChip } from '../components/common/FilterChip';
import { apiRequest, errorMessage } from '../services/apiClient';
import { API_VOCABULARY_TOPICS } from '../services/api';
import { CEFR_LEVELS, VocabularyTopic } from '../services/vocabularyService';
import { testService, TestSetSummary } from '../services/testService';
import {
  contributionService, Contribution, CONTRIB_TYPE_LABELS, CONTRIB_STATUS_LABELS, ReadingQuestionInput,
} from '../services/contributionService';

type Tab = 'vocabulary' | 'reading' | 'test' | 'mine';
const TABS: { key: Tab; label: string }[] = [
  { key: 'vocabulary', label: 'Từ vựng' },
  { key: 'reading', label: 'Bài học' },
  { key: 'test', label: 'Câu hỏi đề thi' },
  { key: 'mine', label: 'Của tôi' },
];
const LETTERS = ['A', 'B', 'C', 'D'];

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={{ gap: 6 }}><Text style={styles.label}>{label}</Text>{children}</View>
);
const Input = (p: React.ComponentProps<typeof TextInput>) => (
  <TextInput placeholderTextColor={Colors.outline} {...p} style={[styles.input, p.multiline && styles.multiline, p.style]} />
);
const LevelPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
    {CEFR_LEVELS.map((l) => <FilterChip key={l} label={l} isActive={value === l} onPress={() => onChange(value === l ? '' : l)} />)}
  </ScrollView>
);
const AnswerPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <View style={{ flexDirection: 'row', gap: 8 }}>
    {LETTERS.map((l) => <FilterChip key={l} label={l} isActive={value === l} onPress={() => onChange(l)} />)}
  </View>
);

const SubmittedNote = () => (
  <Text style={styles.note}>Nội dung bạn gửi sẽ được quản trị viên kiểm duyệt. Khi được duyệt, nội dung hiển thị cho mọi người và bạn nhận thông báo.</Text>
);

function VocabularyForm({ onSent }: { onSent: () => void }) {
  const [topics, setTopics] = useState<VocabularyTopic[]>([]);
  const [f, setF] = useState({ word: '', meaning: '', phonetic: '', example: '', level: '', topic: null as number | null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ topics: VocabularyTopic[] }>(API_VOCABULARY_TOPICS).then((r) => setTopics(r.topics ?? [])).catch(() => {});
  }, []);

  const submit = async () => {
    setError('');
    if (!f.word.trim() || !f.meaning.trim()) { setError('Từ và nghĩa là bắt buộc.'); return; }
    setBusy(true);
    try {
      await contributionService.submitVocabulary({
        word: f.word.trim(), meaning: f.meaning.trim(),
        phonetic: f.phonetic.trim() || undefined, example_sentence: f.example.trim() || undefined,
        difficulty: f.level || undefined, topic_id: f.topic,
      });
      setF({ word: '', meaning: '', phonetic: '', example: '', level: '', topic: null });
      Alert.alert('Đã gửi', 'Từ vựng của bạn đang chờ quản trị viên duyệt.');
      onSent();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <View style={styles.form}>
      <SubmittedNote />
      <ErrorBanner message={error} />
      <Field label="Từ tiếng Anh *"><Input value={f.word} onChangeText={(t) => setF({ ...f, word: t })} maxLength={150} autoCapitalize="none" placeholder="vd: resilient" /></Field>
      <Field label="Nghĩa tiếng Việt *"><Input value={f.meaning} onChangeText={(t) => setF({ ...f, meaning: t })} maxLength={500} placeholder="vd: kiên cường" /></Field>
      <Field label="Phiên âm"><Input value={f.phonetic} onChangeText={(t) => setF({ ...f, phonetic: t })} maxLength={150} placeholder="/rɪˈzɪliənt/" /></Field>
      <Field label="Câu ví dụ"><Input value={f.example} onChangeText={(t) => setF({ ...f, example: t })} multiline maxLength={1000} placeholder="She is a resilient person." /></Field>
      <Field label="Cấp độ"><LevelPicker value={f.level} onChange={(v) => setF({ ...f, level: v })} /></Field>
      {topics.length > 0 && (
        <Field label="Chủ đề">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {topics.map((t) => <FilterChip key={t.id} label={t.name} isActive={f.topic === t.id} onPress={() => setF({ ...f, topic: f.topic === t.id ? null : t.id })} />)}
          </ScrollView>
        </Field>
      )}
      <AppButton title="Gửi duyệt" onPress={submit} loading={busy} />
    </View>
  );
}

interface QDraft { text: string; options: string[]; correct: string; explanation: string }
const newQ = (): QDraft => ({ text: '', options: ['', '', '', ''], correct: '', explanation: '' });

function ReadingForm({ onSent }: { onSent: () => void }) {
  const [f, setF] = useState({ title: '', content: '', level: '', topic: '' });
  const [qs, setQs] = useState<QDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const setQ = (i: number, patch: Partial<QDraft>) => setQs((l) => l.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  const submit = async () => {
    setError('');
    if (!f.title.trim()) { setError('Hãy nhập tiêu đề.'); return; }
    if (f.content.trim().length < 50) { setError('Nội dung bài đọc cần ít nhất 50 ký tự.'); return; }
    const questions: ReadingQuestionInput[] = [];
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      const opts = q.options.map((o) => o.trim()).filter(Boolean);
      if (!q.text.trim() || opts.length < 2) { setError(`Câu ${i + 1}: cần nội dung và ít nhất 2 đáp án.`); return; }
      if (!q.correct || LETTERS.indexOf(q.correct) >= opts.length) { setError(`Câu ${i + 1}: hãy chọn đáp án đúng.`); return; }
      questions.push({ question_text: q.text.trim(), options: opts, correct_answer: q.correct, explanation: q.explanation.trim() || null });
    }
    setBusy(true);
    try {
      await contributionService.submitReading({ title: f.title.trim(), content: f.content.trim(), difficulty: f.level || undefined, topic: f.topic.trim() || undefined, questions });
      setF({ title: '', content: '', level: '', topic: '' });
      setQs([]);
      Alert.alert('Đã gửi', 'Bài học của bạn đang chờ quản trị viên duyệt.');
      onSent();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <View style={styles.form}>
      <SubmittedNote />
      <ErrorBanner message={error} />
      <Field label="Tiêu đề *"><Input value={f.title} onChangeText={(t) => setF({ ...f, title: t })} maxLength={255} /></Field>
      <Field label="Nội dung bài đọc *"><Input value={f.content} onChangeText={(t) => setF({ ...f, content: t })} multiline maxLength={20000} style={{ minHeight: 160 }} textAlignVertical="top" placeholder="Dán hoặc viết bài đọc tiếng Anh (tối thiểu 50 ký tự)" /></Field>
      <Field label="Cấp độ"><LevelPicker value={f.level} onChange={(v) => setF({ ...f, level: v })} /></Field>
      <Field label="Chủ đề"><Input value={f.topic} onChangeText={(t) => setF({ ...f, topic: t })} maxLength={150} placeholder="vd: Du lịch" /></Field>

      <Text style={styles.section}>Câu hỏi trắc nghiệm ({qs.length}/10)</Text>
      {qs.map((q, i) => (
        <View key={i} style={styles.qBox}>
          <View style={styles.qHead}><Text style={styles.label}>Câu {i + 1}</Text><TouchableOpacity onPress={() => setQs((l) => l.filter((_, j) => j !== i))}><Text style={styles.remove}>Xóa</Text></TouchableOpacity></View>
          <Input value={q.text} onChangeText={(t) => setQ(i, { text: t })} placeholder="Nội dung câu hỏi" multiline />
          {q.options.map((o, k) => <Input key={k} value={o} onChangeText={(t) => setQ(i, { options: q.options.map((x, j) => (j === k ? t : x)) })} placeholder={`Đáp án ${LETTERS[k]}`} />)}
          <Text style={styles.label}>Đáp án đúng</Text>
          <AnswerPicker value={q.correct} onChange={(v) => setQ(i, { correct: v })} />
          <Input value={q.explanation} onChangeText={(t) => setQ(i, { explanation: t })} placeholder="Giải thích (không bắt buộc)" multiline />
        </View>
      ))}
      {qs.length < 10 && <AppButton title="+ Thêm câu hỏi" variant="outline" onPress={() => setQs((l) => [...l, newQ()])} />}
      <AppButton title="Gửi duyệt" onPress={submit} loading={busy} />
    </View>
  );
}

function TestQuestionForm({ onSent }: { onSent: () => void }) {
  const [sets, setSets] = useState<TestSetSummary[]>([]);
  const [setId, setSetId] = useState<number | null>(null);
  const [type, setType] = useState<'multiple_choice' | 'fill_blank'>('multiple_choice');
  const [text, setText] = useState('');
  const [passage, setPassage] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState('');
  const [fillAnswer, setFillAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { testService.getTestSets().then(setSets).catch(() => {}); }, []);

  const submit = async () => {
    setError('');
    if (!setId) { setError('Hãy chọn đề thi.'); return; }
    if (!text.trim()) { setError('Hãy nhập nội dung câu hỏi.'); return; }
    let opts: string[] | undefined;
    let answer = fillAnswer.trim();
    if (type === 'multiple_choice') {
      opts = options.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) { setError('Cần ít nhất 2 đáp án.'); return; }
      if (!correct || LETTERS.indexOf(correct) >= opts.length) { setError('Hãy chọn đáp án đúng.'); return; }
      answer = correct;
    } else if (!answer) { setError('Hãy nhập đáp án đúng.'); return; }
    setBusy(true);
    try {
      await contributionService.submitTestQuestion({ test_set_id: setId, question_type: type, question_text: text.trim(), options: opts, correct_answer: answer, passage_text: passage.trim() || undefined });
      setText(''); setPassage(''); setOptions(['', '', '', '']); setCorrect(''); setFillAnswer('');
      Alert.alert('Đã gửi', 'Câu hỏi của bạn đang chờ quản trị viên duyệt.');
      onSent();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <View style={styles.form}>
      <SubmittedNote />
      <ErrorBanner message={error} />
      <Field label="Đề thi *">
        {sets.length === 0 ? <Text style={styles.note}>Đang tải danh sách đề thi...</Text> : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {sets.map((s) => <FilterChip key={s.id} label={`${s.exam_type} · ${s.title}`} isActive={setId === s.id} onPress={() => setSetId(s.id)} />)}
          </ScrollView>
        )}
      </Field>
      <Field label="Dạng câu hỏi">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <FilterChip label="Trắc nghiệm" isActive={type === 'multiple_choice'} onPress={() => setType('multiple_choice')} />
          <FilterChip label="Điền từ" isActive={type === 'fill_blank'} onPress={() => setType('fill_blank')} />
        </View>
      </Field>
      <Field label="Đoạn văn / ngữ cảnh (nếu có)"><Input value={passage} onChangeText={setPassage} multiline style={{ minHeight: 80 }} textAlignVertical="top" /></Field>
      <Field label="Nội dung câu hỏi *"><Input value={text} onChangeText={setText} multiline maxLength={3000} /></Field>
      {type === 'multiple_choice' ? (
        <>
          {options.map((o, k) => <Input key={k} value={o} onChangeText={(t) => setOptions((l) => l.map((x, j) => (j === k ? t : x)))} placeholder={`Đáp án ${LETTERS[k]}`} />)}
          <Field label="Đáp án đúng"><AnswerPicker value={correct} onChange={setCorrect} /></Field>
        </>
      ) : (
        <Field label="Đáp án đúng *"><Input value={fillAnswer} onChangeText={setFillAnswer} maxLength={255} autoCapitalize="none" /></Field>
      )}
      <AppButton title="Gửi duyệt" onPress={submit} loading={busy} />
    </View>
  );
}

const STATUS_COLORS = { pending: '#b7791f', approved: Colors.primary, rejected: Colors.error } as const;

function MineList({ items, max, loading, onWithdraw }: { items: Contribution[]; max: number; loading: boolean; onWithdraw: (c: Contribution) => void }) {
  if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />;
  const pending = items.filter((i) => i.status === 'pending').length;
  return (
    <View style={styles.form}>
      <Text style={styles.note}>Đang chờ duyệt: {pending}/{max}</Text>
      {items.length === 0 && <Text style={styles.empty}>Bạn chưa gửi đóng góp nào.</Text>}
      {items.map((c) => (
        <View key={c.id} style={styles.mineCard}>
          <View style={styles.qHead}>
            <Text style={styles.mineType}>{CONTRIB_TYPE_LABELS[c.content_type]}</Text>
            <Text style={[styles.status, { color: STATUS_COLORS[c.status] }]}>{CONTRIB_STATUS_LABELS[c.status]}</Text>
          </View>
          <Text style={styles.mineTitle} numberOfLines={2}>{c.title || `#${c.content_id}`}</Text>
          {c.status === 'rejected' && c.reject_reason ? <Text style={styles.reason}>Lý do: {c.reject_reason}</Text> : null}
          <View style={styles.qHead}>
            <Text style={styles.mineDate}>{new Date(c.created_at).toLocaleDateString('vi-VN')}</Text>
            {c.status === 'pending' && <TouchableOpacity onPress={() => onWithdraw(c)}><Text style={styles.remove}>Rút lại</Text></TouchableOpacity>}
          </View>
        </View>
      ))}
    </View>
  );
}

export default function ContributeScreen() {
  const [tab, setTab] = useState<Tab>('vocabulary');
  const [mine, setMine] = useState<Contribution[]>([]);
  const [max, setMax] = useState(20);
  const [loadingMine, setLoadingMine] = useState(true);
  const [error, setError] = useState('');

  const loadMine = useCallback(async () => {
    try {
      const r = await contributionService.listMine();
      setMine(r.items); setMax(r.max_pending);
    } catch (e) { setError(errorMessage(e)); } finally { setLoadingMine(false); }
  }, []);
  useFocusEffect(useCallback(() => { loadMine(); }, [loadMine]));

  const withdraw = (c: Contribution) => Alert.alert('Rút lại đóng góp', 'Nội dung này sẽ bị xóa khỏi hàng chờ duyệt.', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Rút lại', style: 'destructive', onPress: async () => { try { await contributionService.withdraw(c.id); await loadMine(); } catch (e) { setError(errorMessage(e)); } } },
  ]);

  const sent = () => { loadMine(); setTab('mine'); };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Đóng góp nội dung" showBack />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={{ flexGrow: 0 }}>
        {TABS.map((t) => <FilterChip key={t.key} label={t.label} isActive={tab === t.key} onPress={() => setTab(t.key)} count={t.key === 'mine' ? mine.filter((m) => m.status === 'pending').length || undefined : undefined} />)}
      </ScrollView>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error ? <ErrorBanner message={error} /> : null}
          {tab === 'vocabulary' && <VocabularyForm onSent={sent} />}
          {tab === 'reading' && <ReadingForm onSent={sent} />}
          {tab === 'test' && <TestQuestionForm onSent={sent} />}
          {tab === 'mine' && <MineList items={mine} max={max} loading={loadingMine} onWithdraw={withdraw} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  tabs: { paddingHorizontal: Spacing.margin, paddingVertical: Spacing.sm, gap: 8 },
  content: { padding: Spacing.margin, paddingBottom: 60, gap: Spacing.md },
  form: { gap: Spacing.md },
  label: { ...Typography.labelMd, color: Colors.onSurface, fontWeight: '700' },
  section: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '800', marginTop: Spacing.sm },
  input: { borderRadius: Rounded.md, backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1, borderColor: Colors.surfaceContainerHighest, paddingHorizontal: Spacing.md, paddingVertical: 12, color: Colors.onSurface },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  note: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  qBox: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Rounded.lg, padding: Spacing.md, gap: Spacing.sm },
  qHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remove: { ...Typography.labelMd, color: Colors.error, fontWeight: '700' },
  empty: { textAlign: 'center', color: Colors.onSurfaceVariant, marginTop: 32 },
  mineCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Rounded.lg, padding: Spacing.md, gap: 6, borderWidth: 1, borderColor: Colors.surfaceContainerHighest },
  mineType: { ...Typography.labelSm, color: Colors.onSurfaceVariant, fontWeight: '700' },
  status: { ...Typography.labelMd, fontWeight: '800' },
  mineTitle: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '600' },
  reason: { ...Typography.bodyMd, color: Colors.error },
  mineDate: { ...Typography.labelSm, color: Colors.outline },
});
