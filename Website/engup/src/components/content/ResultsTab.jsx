import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { resultsService } from '../../services';
import { Badge, DataTable, ErrorBanner, FilterChips, Pagination, Panel, SearchInput } from '../ui';

const PAGE_SIZE = 15;
const KINDS = [
  { value: 'tests', label: 'Đề thi' },
  { value: 'reading', label: 'Bài đọc' },
  { value: 'listening', label: 'Bài nghe' },
  { value: 'writing', label: 'Bài viết' },
];
const fmtDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '—');
const pct = (v) => (v === null || v === undefined ? '—' : `${Math.round(v)}%`);
const tone = (v) => (v === null || v === undefined ? 'off' : v >= 60 ? 'ok' : 'warn');

const userCol = { key: 'user', header: 'Học viên', render: (a) => (
  <><span className="cell-strong">{a.user_name || `#${a.user_id}`}</span>{a.user_email && <div className="cell-sub">{a.user_email}</div>}</>
) };
const titleCol = { key: 'title', header: 'Bài', render: (a) => a.title || '—' };
const dateCol = (key = 'submitted_at', header = 'Nộp lúc') => ({ key, header, render: (a) => fmtDate(a[key]) });

const COLUMNS = {
  tests: [
    userCol, titleCol,
    { key: 'score', header: 'Điểm', render: (a) => <Badge tone={tone(a.score)}>{pct(a.score)}</Badge> },
    { key: 'band', header: 'Band', render: (a) => a.band_score ?? '—' },
    { key: 'status', header: 'Trạng thái', render: (a) => <Badge tone={a.status === 'submitted' ? 'ok' : 'warn'}>{a.status === 'submitted' ? 'Đã nộp' : 'Đang làm'}</Badge> },
    dateCol('started_at', 'Bắt đầu'), dateCol(),
  ],
  reading: [
    userCol, titleCol,
    { key: 'score', header: 'Điểm', render: (a) => <Badge tone={tone(a.score)}>{pct(a.score)}</Badge> },
    { key: 'correct', header: 'Số câu đúng', render: (a) => `${a.correct_count}/${a.total_count}` },
    dateCol(),
  ],
  listening: [
    userCol, titleCol,
    { key: 'acc', header: 'Độ chính xác', render: (a) => <Badge tone={tone(a.accuracy_percent)}>{pct(a.accuracy_percent)}</Badge> },
    { key: 'wrong', header: 'Từ sai', render: (a) => a.wrong_count },
    dateCol(),
  ],
  writing: [
    userCol, titleCol,
    { key: 'ai', header: 'Điểm AI', render: (a) => (a.ai_score === null ? <Badge tone="off">Chưa chấm</Badge> : <Badge tone="ok">{a.ai_score}</Badge>) },
    dateCol(),
  ],
};

export default function ResultsTab() {
  const [kind, setKind] = useState('tests');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const { data, loading, error, reload } = useFetch(() => resultsService[kind]({ limit: 200 }), [kind]);

  const kw = search.trim().toLowerCase();
  const all = (data?.attempts || []).filter((a) => !kw || `${a.user_name || ''} ${a.user_email || ''} ${a.title || ''}`.toLowerCase().includes(kw));
  const rows = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="stack">
      <ErrorBanner message={error} onRetry={reload} />
      <Panel bodyClass="">
        <div className="toolbar toolbar--inline">
          <SearchInput placeholder="Tìm theo học viên hoặc tên bài..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <FilterChips label="Loại bài:" options={KINDS} value={kind} onChange={(v) => { setKind(v); setPage(1); setOpen(null); }} />
        </div>
        <DataTable columns={COLUMNS[kind]} rows={rows} loading={loading} selectedId={open?.id}
          onRowClick={kind === 'writing' ? (a) => setOpen(open?.id === a.id ? null : a) : undefined}
          emptyText="Chưa có học viên nào nộp bài loại này. Điểm sẽ xuất hiện sau khi học viên nộp bài trên ứng dụng." />
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(all.length / PAGE_SIZE))} onChange={setPage} summary={`Tổng số ${all.length} lượt`} />
      </Panel>
      {kind === 'writing' && open && (
        <Panel title={`Bài viết của ${open.user_name || `#${open.user_id}`}`} subtitle={open.title || ''}>
          <p style={{ whiteSpace: 'pre-wrap' }}>{open.content}</p>
          {open.ai_feedback && <><h4 style={{ marginTop: 16 }}>Nhận xét AI</h4><p style={{ whiteSpace: 'pre-wrap' }}>{typeof open.ai_feedback === 'string' ? open.ai_feedback : JSON.stringify(open.ai_feedback, null, 2)}</p></>}
        </Panel>
      )}
    </div>
  );
}
