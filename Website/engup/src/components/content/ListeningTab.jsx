import { useState } from 'react';
import { CEFR_LEVELS, CEFR_OPTIONS } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { clean, useFormState } from '../../hooks/useFormState';
import { errorMessage, listeningService } from '../../services';
import { Badge, DataTable, ErrorBanner, FileField, FilterChips, LinkButton, Pagination, Panel, SearchInput, SelectField, TextAreaField, TextField } from '../ui';
import LevelBadge from '../common/LevelBadge';
import DeleteDialog from '../common/DeleteDialog';
import FormPanel from './FormPanel';

const PAGE_SIZE = 10;
const LEVELS = [{ value: '', label: 'Tất cả' }, ...CEFR_LEVELS.map((l) => ({ value: l, label: l }))];

function LessonForm({ lesson, onSaved, onCancel }) {
  const editing = !!lesson;
  const [file, setFile] = useState(null);
  const [v, bind] = useFormState({
    title: lesson?.title ?? '', topic: lesson?.topic ?? '', difficulty: lesson?.difficulty ?? '', transcript: lesson?.transcript ?? '',
  });

  const submit = async () => {
    const payload = { title: v.title.trim(), transcript: v.transcript.trim(), topic: clean(v.topic), difficulty: clean(v.difficulty) };
    const saved = editing ? await listeningService.update(lesson.id, payload) : await listeningService.create(payload);
    const id = saved?.id ?? lesson?.id;
    if (file && id) await listeningService.uploadAudio(id, file);
    onSaved();
  };

  return (
    <FormPanel title={editing ? 'Chỉnh sửa bài nghe' : 'Thêm bài nghe mới'} subtitle="Biên tập nội dung chương trình"
      submitLabel="Lưu bài nghe" onSubmit={submit} onCancel={onCancel}>
      <TextField label="Tiêu đề" required value={v.title} onChange={bind('title')} />
      <div className="form-row">
        <TextField label="Chủ đề" value={v.topic} onChange={bind('topic')} />
        <SelectField label="Cấp độ chuẩn CEFR" options={CEFR_OPTIONS} value={v.difficulty} onChange={bind('difficulty')} />
      </div>
      <TextAreaField label="Văn bản (transcript)" required rows={8} value={v.transcript} onChange={bind('transcript')} />
      <FileField label="Tệp âm thanh" accept="audio/*" hint="mp3, wav, m4a hoặc ogg, tối đa 20MB. Bỏ trống nếu không đổi." onChange={(e) => setFile(e.target.files?.[0] || null)} />
    </FormPanel>
  );
}

export default function ListeningTab({ onChanged }) {
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [loadErr, setLoadErr] = useState('');

  const { data, loading, error, reload } = useFetch(() => listeningService.list({ difficulty: level }), [level]);
  const kw = search.trim().toLowerCase();
  const all = (data?.lessons || []).filter((l) => !kw || `${l.title} ${l.topic || ''}`.toLowerCase().includes(kw));
  const rows = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const refresh = () => { reload(); onChanged?.(); };

  const startEdit = async (l) => {
    setLoadErr('');
    try { setEditing({ ...l, ...(await listeningService.detail(l.id)) }); } catch (e) { setLoadErr(errorMessage(e)); }
  };

  const columns = [
    { key: 'title', header: 'Tiêu đề', render: (l) => <span className="cell-strong">{l.title}</span> },
    { key: 'topic', header: 'Chủ đề', render: (l) => l.topic || '—' },
    { key: 'difficulty', header: 'Cấp độ', render: (l) => <LevelBadge level={l.difficulty} /> },
    { key: 'audio', header: 'Âm thanh', render: (l) => <Badge tone={l.audio_url ? 'ok' : 'warn'}>{l.audio_url ? 'Đã có' : 'Chưa có'}</Badge> },
    { key: 'action', header: 'Thao tác', align: 'right', render: (l) => (
      <span className="actions"><LinkButton onClick={() => startEdit(l)}>Sửa</LinkButton><LinkButton tone="danger" onClick={() => setRemoving(l)}>Xóa</LinkButton></span>
    ) },
  ];

  return (
    <div className="split">
      <div className="stack">
        <ErrorBanner message={error || loadErr} onRetry={error ? reload : undefined} />
        <Panel bodyClass="">
          <div className="toolbar toolbar--inline">
            <SearchInput placeholder="Tìm theo tiêu đề hoặc chủ đề..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            <FilterChips label="Lọc cấp độ:" options={LEVELS} value={level} onChange={(v) => { setLevel(v); setPage(1); }} />
          </div>
          <DataTable columns={columns} rows={rows} loading={loading} selectedId={editing?.id} emptyText="Chưa có bài nghe nào." />
          <Pagination page={page} totalPages={Math.max(1, Math.ceil(all.length / PAGE_SIZE))} onChange={setPage} summary={`Tổng số ${all.length} bài nghe`} />
        </Panel>
      </div>
      <LessonForm key={editing?.id ?? 'new'} lesson={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />
      <DeleteDialog target={removing} label={removing ? `bài nghe "${removing.title}"` : ''} onClose={() => setRemoving(null)}
        onDelete={async (l) => { await listeningService.remove(l.id); if (editing?.id === l.id) setEditing(null); refresh(); }} />
    </div>
  );
}
