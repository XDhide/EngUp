import { useMemo, useState } from 'react';
import { CEFR_LEVELS, CEFR_OPTIONS } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { clean, useFormState } from '../../hooks/useFormState';
import { vocabularyService } from '../../services';
import { Button, DataTable, ErrorBanner, FilterChips, Pagination, Panel, SearchInput, SelectField, TextAreaField, TextField, LinkButton } from '../ui';
import LevelBadge from '../common/LevelBadge';
import DeleteDialog from '../common/DeleteDialog';
import FormPanel from './FormPanel';
import BulkImportPanel from './BulkImportPanel';
import TopicPicker from './TopicPicker';

const PAGE_SIZE = 10;
const LEVELS = [{ value: '', label: 'Tất cả' }, ...CEFR_LEVELS.map((l) => ({ value: l, label: l }))];
const EMPTY = { word: '', phonetic: '', meaning: '', difficulty: '', topic_id: '', example_sentence: '' };

function WordForm({ word, topics, onTopicsChanged, onSaved, onCancel }) {
  const editing = !!word;
  const [v, bind, setValues] = useFormState(editing
    ? { ...EMPTY, ...Object.fromEntries(Object.entries(word).map(([k, val]) => [k, val ?? ''])) }
    : EMPTY);

  const submit = async () => {
    const payload = {
      word: v.word.trim(), meaning: v.meaning.trim(), phonetic: clean(v.phonetic),
      example_sentence: clean(v.example_sentence), difficulty: clean(v.difficulty),
      topic_id: v.topic_id ? Number(v.topic_id) : null,
    };
    if (editing) await vocabularyService.update(word.id, payload);
    else await vocabularyService.create(payload);
    onSaved();
  };

  return (
    <FormPanel title={editing ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng mới'} subtitle="Biên tập nội dung chương trình"
      submitLabel="Lưu từ vựng" onSubmit={submit} onCancel={onCancel}>
      <TextField label="Từ tiếng Anh" required placeholder="Ví dụ: Adaptability" value={v.word} onChange={bind('word')} />
      <TextField label="Phiên âm IPA" placeholder="Ví dụ: /əˌdæp.təˈbɪl.ə.ti/" value={v.phonetic} onChange={bind('phonetic')} />
      <TextField label="Nghĩa tiếng Việt" required placeholder="Ví dụ: Khả năng thích ứng" value={v.meaning} onChange={bind('meaning')} />
      <div className="form-row">
        <SelectField label="Cấp độ chuẩn CEFR" options={CEFR_OPTIONS} value={v.difficulty} onChange={bind('difficulty')} />
      </div>
      <TopicPicker topics={topics} value={v.topic_id} onChange={(id) => setValues((s) => ({ ...s, topic_id: id }))} onTopicsChanged={onTopicsChanged} />
      <TextAreaField label="Câu ví dụ" placeholder="Ví dụ: Adaptability is an essential skill in modern workplaces." value={v.example_sentence} onChange={bind('example_sentence')} />
    </FormPanel>
  );
}

export default function VocabularyTab({ onChanged }) {
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null = thêm mới
  const [removing, setRemoving] = useState(null);
  const [bulk, setBulk] = useState(false);

  const topicsQ = useFetch(() => vocabularyService.topics(), []);
  const topics = useMemo(() => topicsQ.data?.topics || [], [topicsQ.data]);
  const topicName = useMemo(() => Object.fromEntries(topics.map((t) => [t.id, t.name])), [topics]);

  const { data, loading, error, reload } = useFetch(
    () => vocabularyService.list({ difficulty: level, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    [level, page],
  );
  const total = data?.total ?? 0;
  const all = data?.words || [];
  // Backend chưa hỗ trợ tìm kiếm nên lọc trên trang đang hiển thị.
  const kw = search.trim().toLowerCase();
  const words = kw ? all.filter((w) => `${w.word} ${w.phonetic || ''} ${w.meaning}`.toLowerCase().includes(kw)) : all;
  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0;

  const refresh = () => { reload(); onChanged?.(); };

  const columns = [
    { key: 'word', header: 'Từ vựng', render: (w) => <span className="cell-strong">{w.word}</span> },
    { key: 'phonetic', header: 'Phiên âm', render: (w) => <span className="mono">{w.phonetic || '—'}</span> },
    { key: 'meaning', header: 'Nghĩa tiếng Việt' },
    { key: 'difficulty', header: 'Cấp độ', render: (w) => <LevelBadge level={w.difficulty} /> },
    { key: 'topic', header: 'Chủ đề', render: (w) => topicName[w.topic_id] || '—' },
    { key: 'action', header: 'Thao tác', align: 'right', render: (w) => (
      <span className="actions"><LinkButton onClick={() => { setBulk(false); setEditing(w); }}>Sửa</LinkButton><LinkButton tone="danger" onClick={() => setRemoving(w)}>Xóa</LinkButton></span>
    ) },
  ];

  return (
    <div className="split">
      <div className="stack">
        <ErrorBanner message={error} onRetry={reload} />
        <Panel bodyClass="">
          <div className="toolbar toolbar--inline">
            <SearchInput placeholder="Tìm theo từ, phiên âm hoặc nghĩa..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <FilterChips label="Lọc cấp độ:" options={LEVELS} value={level} onChange={(v) => { setLevel(v); setPage(1); }} />
          </div>
          <DataTable columns={columns} rows={words} loading={loading} selectedId={editing?.id} emptyText="Chưa có từ vựng nào." />
          <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} onChange={setPage}
            summary={`Hiển thị ${from} - ${from ? from + all.length - 1 : 0} trên tổng số ${total} từ`} />
        </Panel>
      </div>
      <div>
        {bulk ? (
          <BulkImportPanel topics={topics} onTopicsChanged={topicsQ.reload} onCancel={() => setBulk(false)} onDone={refresh} />
        ) : (<>
          <div style={{ marginBottom: 16 }}><Button variant="primary" onClick={() => { setEditing(null); setBulk(true); }}>Nhập hàng loạt (dán / CSV / AI)</Button></div>
          <WordForm key={editing?.id ?? 'new'} word={editing} topics={topics} onTopicsChanged={topicsQ.reload} onCancel={() => setEditing(null)}
            onSaved={() => { setEditing(null); refresh(); }} />
        </>)}
        {editing && <div style={{ marginTop: 16 }}><Button onClick={() => setEditing(null)}>Chuyển sang thêm từ mới</Button></div>}
      </div>
      <DeleteDialog target={removing} label={removing ? `từ "${removing.word}"` : ''} onClose={() => setRemoving(null)}
        onDelete={async (w) => { await vocabularyService.remove(w.id); if (editing?.id === w.id) setEditing(null); refresh(); }} />
    </div>
  );
}
