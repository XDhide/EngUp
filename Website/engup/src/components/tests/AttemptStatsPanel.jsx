import { useFetch } from '../../hooks/useFetch';
import { resultsService, testsService } from '../../services';
import { Badge, Button, DataTable, ErrorBanner, Panel } from '../ui';

const fmtDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

export default function AttemptStatsPanel({ testSet, onClose }) {
  // Thống kê tổng (tỷ lệ hoàn thành) + danh sách chi tiết kèm tên học viên.
  const { data, loading, error, reload } = useFetch(async () => {
    const [stats, detail] = await Promise.all([
      testsService.attempts(testSet.id),
      resultsService.tests({ test_set_id: testSet.id, limit: 200 }).catch(() => null),
    ]);
    return { stats, attempts: detail?.attempts ?? stats.attempts };
  }, [testSet.id]);

  const columns = [
    { key: 'user', header: 'Học viên', render: (a) => (
      <><span className="cell-strong">{a.user_name || `#${a.user_id}`}</span>{a.user_email && <div className="cell-sub">{a.user_email}</div>}</>
    ) },
    { key: 'score', header: 'Điểm (%)', render: (a) => (a.score === null || a.score === undefined ? <Badge tone="off">Chưa có</Badge> : <Badge tone={a.score >= 60 ? 'ok' : 'warn'}>{Math.round(a.score)}%</Badge>) },
    { key: 'band_score', header: 'Band / điểm quy đổi', render: (a) => a.band_score ?? '—' },
    { key: 'status', header: 'Trạng thái', render: (a) => <Badge tone={a.status === 'submitted' ? 'ok' : 'warn'}>{a.status === 'submitted' ? 'Đã nộp' : 'Đang làm'}</Badge> },
    { key: 'time', header: 'Nộp lúc', render: (a) => fmtDate(a.submitted_at) },
  ];
  const attempts = data?.attempts || [];
  return (
    <Panel title={`Kết quả: ${testSet.title}`} bodyClass=""
      subtitle={data ? `Tỷ lệ hoàn thành ${data.stats.completion_rate}% - ${attempts.length} lượt làm bài` : 'Thống kê lượt làm bài theo đề'}
      action={<Button onClick={onClose}>Đóng</Button>}>
      <div style={{ padding: error ? 16 : 0 }}><ErrorBanner message={error} onRetry={reload} /></div>
      <DataTable columns={columns} rows={attempts} loading={loading} rowKey={(a, i) => `${a.id ?? a.user_id}-${i}`}
        emptyText="Chưa có lượt làm bài nào. Điểm xuất hiện sau khi học viên nộp bài trên ứng dụng." />
    </Panel>
  );
}
