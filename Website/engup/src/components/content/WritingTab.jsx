import { useState } from 'react';
import { CEFR_OPTIONS } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { clean, useFormState } from '../../hooks/useFormState';
import { writingService } from '../../services';
import { Badge, DataTable, ErrorBanner, FilterChips, LinkButton, Pagination, Panel, SearchInput, SelectField, TextAreaField, TextField } from '../ui';
import LevelBadge from '../common/LevelBadge';
import DeleteDialog from '../common/DeleteDialog';
import FormPanel from './FormPanel';

const PAGE_SIZE = 10;
const TYPES = [
  { value: 'free', label: 'Viết tự do' },
  { value: 'ielts', label: 'IELTS Writing' },
  { value: 'toeic', label: 'TOEIC Writing' },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));
const FILTERS = [{ value: '', label: 'Tất cả' }, ...TYPES];

function PromptForm({ prompt, onSaved, onCancel }) {
  const editing = !!prompt;
  const [v, bind] = useFormState({
    title: prompt?.title ?? '', prompt_text: prompt?.prompt_text ?? '', type: prompt?.type ?? 'free', difficulty: prompt?.difficulty ?? '',
  });

  const submit = async () => {
    const payload = { title: v.title.trim(), prompt_text: v.prompt_text.trim(), type: v.type || 'free', difficulty: clean(v.difficulty) };
    if (editing) await writingService.update(prompt.id, payload); else await writingService.create(payload);
    onSaved();
  };

  return (
    <FormPanel title={editing ? 'Chỉnh sửa đề bài viết' : 'Thêm đề bài viết mới'} subtitle="Học viên sẽ thấy đề này ở mục Viết trên ứng dụng"
      submitLabel="Lưu đề bài" onSubmit={submit} onCancel={onCancel}>
      <TextField label="Tiêu đề" required value={v.title} onChange={bind('title')} />
      <div className="form-row">
        <SelectField label="Loại đề" options={TYPES} placeholder="Chọn loại..." value={v.type} onChange={bind('type')} />
        <SelectField label="Cấp độ chuẩn CEFR" options={CEFR_OPTIONS} value={v.difficulty} onChange={bind('difficulty')} />
      </div>
      <TextAreaField label="Nội dung đề bài" required rows={8} value={v.prompt_text} onChange={bind('prompt_text')}
        hint="Ví dụ: Some people think... Discuss both views and give your opinion." />
    </FormPanel>
  );
}

export default function WritingTab({ onChanged }) {
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const { data, loading, error, reload } = useFetch(() => writingService.list(), []);

  const kw = search.trim().toLowerCase();
  const all = (data?.prompts || []).filter((p) => (!type || p.type === type) && (!kw || `${p.title} ${p.prompt_text}`.toLowerCase().includes(kw)));
  const rows = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const refresh = () => { reload(); onChanged?.(); };

  const columns = [
    { key: 'title', header: 'Tiêu đề', render: (p) => <><span className="cell-strong">{p.title}</span><div className="cell-sub">{p.prompt_text.slice(0, 80)}{p.prompt_text.length > 80 ? '…' : ''}</div></> },
    { key: 'type', header: 'Loại', render: (p) => <Badge tone="off">{TYPE_LABEL[p.type] || p.type}</Badge> },
    { key: 'difficulty', header: 'Cấp độ', render: (p) => <LevelBadge level={p.difficulty} /> },
    { key: 'action', header: 'Thao tác', align: 'right', render: (p) => (
      <span className="actions"><LinkButton onClick={() => setEditing(p)}>Sửa</LinkButton><LinkButton tone="danger" onClick={() => setRemoving(p)}>Xóa</LinkButton></span>
    ) },
  ];

  return (
    <div className="split">
      <div className="stack">
        <ErrorBanner message={error} onRetry={reload} />
        <Panel bodyClass="">
          <div className="toolbar toolbar--inline">
            <SearchInput placeholder="Tìm theo tiêu đề hoặc nội dung..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            <FilterChips label="Loại đề:" options={FILTERS} value={type} onChange={(v) => { setType(v); setPage(1); }} />
          </div>
          <DataTable columns={columns} rows={rows} loading={loading} selectedId={editing?.id} emptyText="Chưa có đề bài viết nào. Hãy thêm đề ở khung bên phải." />
          <Pagination page={page} totalPages={Math.max(1, Math.ceil(all.length / PAGE_SIZE))} onChange={setPage} summary={`Tổng số ${all.length} đề bài`} />
        </Panel>
      </div>
      <PromptForm key={editing?.id ?? 'new'} prompt={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />
      <DeleteDialog target={removing} label={removing ? `đề bài "${removing.title}" cùng toàn bộ bài nộp của học viên` : ''} onClose={() => setRemoving(null)}
        onDelete={async (p) => { await writingService.remove(p.id); if (editing?.id === p.id) setEditing(null); refresh(); }} />
    </div>
  );
}
