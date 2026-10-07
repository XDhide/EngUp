import { useFetch } from '../../hooks/useFetch';
import { testsService } from '../../services';
import { Badge, Button, DataTable, ErrorBanner, Panel } from '../ui';

export default function AttemptStatsPanel({ testSet, onClose }) {
  const { data, loading, error, reload } = useFetch(() => testsService.attempts(testSet.id), [testSet.id]);
  const columns = [
    { key: 'user_id', header: 'Mã người dùng', render: (a) => `#${a.user_id}` },
    { key: 'score', header: 'Điểm', render: (a) => a.score ?? '—' },
    { key: 'band_score', header: 'Band / điểm quy đổi', render: (a) => a.band_score ?? '—' },
    { key: 'status', header: 'Trạng thái', render: (a) => <Badge tone={a.status === 'submitted' ? 'ok' : 'warn'}>{a.status === 'submitted' ? 'Đã nộp' : 'Đang làm'}</Badge> },
  ];
  return (
    <Panel title={`Kết quả: ${testSet.title}`} bodyClass=""
      subtitle={data ? `Tỷ lệ hoàn thành ${data.completion_rate}% - ${data.attempts.length} lượt làm bài` : 'Thống kê lượt làm bài theo đề'}
      action={<Button onClick={onClose}>Đóng</Button>}>
      <div style={{ padding: error ? 16 : 0 }}><ErrorBanner message={error} onRetry={reload} /></div>
      <DataTable columns={columns} rows={data?.attempts || []} loading={loading} rowKey={(a, i) => `${a.user_id}-${i}`} emptyText="Chưa có lượt làm bài nào." />
    </Panel>
  );
}
