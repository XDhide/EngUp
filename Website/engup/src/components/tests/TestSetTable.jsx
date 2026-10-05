import { DataTable, LinkButton } from '../ui';

export default function TestSetTable({ sets, loading, activeId, onEditQuestions, onStats, onEditSet, onRemove }) {
  const columns = [
    { key: 'title', header: 'Tên đề thi', render: (s) => (
      <><span className="cell-strong" style={s.id === activeId ? { color: 'var(--primary)' } : undefined}>{s.title}</span><div className="cell-sub">Mã: #{s.id}</div></>
    ) },
    { key: 'type', header: 'Thể loại', render: (s) => <>{s.exam_type}<div className="cell-sub">{s.section}</div></> },
    { key: 'time', header: 'Thời gian', render: (s) => `${s.time_limit_minutes} phút` },
    { key: 'action', header: 'Thao tác', align: 'right', render: (s) => (
      <span className="actions">
        <LinkButton onClick={() => onEditQuestions(s)}>Chỉnh sửa câu hỏi</LinkButton><span className="sep" />
        <LinkButton onClick={() => onStats(s)}>Xem kết quả</LinkButton><span className="sep" />
        <LinkButton tone="muted" onClick={() => onEditSet(s)}>Sửa đề</LinkButton><span className="sep" />
        <LinkButton tone="danger" onClick={() => onRemove(s)}>Xóa</LinkButton>
      </span>
    ) },
  ];
  return <DataTable columns={columns} rows={sets} loading={loading} emptyText="Chưa có bộ đề nào." />;
}
