import { useState } from 'react';
import { CEFR_LEVELS, CEFR_OPTIONS } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { clean, useFormState } from '../../hooks/useFormState';
import { errorMessage, readingService } from '../../services';
import { Badge, DataTable, ErrorBanner, FilterChips, InfoNote, LinkButton, Pagination, Panel, SearchInput, SelectField, TextAreaField, TextField } from '../ui';
import LevelBadge from '../common/LevelBadge';
import DeleteDialog from '../common/DeleteDialog';
import FormPanel from './FormPanel';

const PAGE_SIZE = 10;
const LEVELS = [{ value: '', label: 'Tất cả' }, ...CEFR_LEVELS.map((l) => ({ value: l, label: l }))];

function ArticleForm({ article, onSaved, onCancel }) {
  const editing = !!article;
  const [v, bind] = useFormState({
    title: article?.title ?? '', topic: article?.topic ?? '', difficulty: article?.difficulty ?? '', content: article?.content ?? '',
  });

  const submit = async () => {
    const payload = { title: v.title.trim(), content: v.content.trim(), topic: clean(v.topic), difficulty: clean(v.difficulty) };
    if (editing) await readingService.update(article.id, payload);
    else await readingService.create(payload);
    onSaved();
  };

  return (
    <FormPanel title={editing ? 'Chỉnh sửa bài đọc' : 'Thêm bài đọc mới'} subtitle="Biên tập nội dung chương trình"
      submitLabel="Lưu bài đọc" onSubmit={submit} onCancel={onCancel}>
      <TextField label="Tiêu đề" required value={v.title} onChange={bind('title')} />
      <div className="form-row">
        <TextField label="Chủ đề" placeholder="Ví dụ: Công việc" value={v.topic} onChange={bind('topic')} />
        <SelectField label="Cấp độ chuẩn CEFR" options={CEFR_OPTIONS} value={v.difficulty} onChange={bind('difficulty')} />
      </div>
      <TextAreaField label="Nội dung bài đọc" required rows={10} value={v.content} onChange={bind('content')} />
    </FormPanel>
  );
}

export default function ReadingTab({ onChanged }) {
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [loadErr, setLoadErr] = useState('');

  const { data, loading, error, reload } = useFetch(() => readingService.list({ difficulty: level }), [level]);
  const kw = search.trim().toLowerCase();
  const all = (data?.articles || []).filter((a) => !kw || `${a.title} ${a.topic || ''}`.toLowerCase().includes(kw));
  const rows = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const refresh = () => { reload(); onChanged?.(); };

  // Nội dung đầy đủ chỉ có ở API chi tiết nên tải trước khi mở form sửa.
  const startEdit = async (a) => {
    setLoadErr('');
    try { setEditing(await readingService.detail(a.id)); } catch (e) { setLoadErr(errorMessage(e)); }
  };

  const columns = [
    { key: 'title', header: 'Tiêu đề', render: (a) => <span className="cell-strong">{a.title}</span> },
    { key: 'topic', header: 'Chủ đề', render: (a) => a.topic || '—' },
    { key: 'difficulty', header: 'Cấp độ', render: (a) => <LevelBadge level={a.difficulty} /> },
    { key: 'ai', header: 'Nguồn', render: (a) => <Badge tone={a.is_ai_generated ? 'warn' : 'off'}>{a.is_ai_generated ? 'AI tạo' : 'Biên tập viên'}</Badge> },
    { key: 'action', header: 'Thao tác', align: 'right', render: (a) => (
      <span className="actions"><LinkButton onClick={() => startEdit(a)}>Sửa</LinkButton><LinkButton tone="danger" onClick={() => setRemoving(a)}>Xóa</LinkButton></span>
    ) },
  ];

  return (
    <div className="split">
      <div className="stack">
        <ErrorBanner message={error || loadErr} onRetry={error ? reload : undefined} />
        <InfoNote>Danh sách chỉ gồm các bài đọc đã được duyệt. Bài mới chờ duyệt xem tại mục Duyệt nội dung.</InfoNote>
        <Panel bodyClass="">
          <div className="toolbar toolbar--inline">
            <SearchInput placeholder="Tìm theo tiêu đề hoặc chủ đề..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            <FilterChips label="Lọc cấp độ:" options={LEVELS} value={level} onChange={(v) => { setLevel(v); setPage(1); }} />
          </div>
          <DataTable columns={columns} rows={rows} loading={loading} selectedId={editing?.id} emptyText="Chưa có bài đọc nào." />
          <Pagination page={page} totalPages={Math.max(1, Math.ceil(all.length / PAGE_SIZE))} onChange={setPage} summary={`Tổng số ${all.length} bài đọc`} />
        </Panel>
      </div>
      <ArticleForm key={editing?.id ?? 'new'} article={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />
      <DeleteDialog target={removing} label={removing ? `bài đọc "${removing.title}"` : ''} onClose={() => setRemoving(null)}
        onDelete={async (a) => { await readingService.remove(a.id); if (editing?.id === a.id) setEditing(null); refresh(); }} />
    </div>
  );
}
