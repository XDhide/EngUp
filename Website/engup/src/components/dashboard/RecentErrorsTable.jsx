import { Link } from 'react-router-dom';
import { Badge, DataTable, Panel } from '../ui';
import { LOG_LEVEL_LABELS } from '../../constants';
import { formatDateTime, levelTone } from '../../utils/format';

export default function RecentErrorsTable({ errors }) {
  const columns = [
    { key: 'created_at', header: 'Thời gian', render: (r) => <span className="mono">{formatDateTime(r.created_at)}</span> },
    { key: 'service', header: 'Phân hệ', render: (r) => <Badge tone="off">{r.service}</Badge> },
    { key: 'message', header: 'Chi tiết sự cố' },
    { key: 'level', header: 'Mức độ', render: (r) => <Badge tone={levelTone(r.level)}>{LOG_LEVEL_LABELS[r.level] || r.level}</Badge> },
  ];
  return (
    <Panel title="Lỗi hệ thống gần đây" subtitle="10 sự cố mới nhất được ghi nhận" bodyClass=""
      action={<Link to="/logs">Xem toàn bộ nhật ký</Link>}>
      <DataTable columns={columns} rows={errors} rowKey={(r, i) => `${r.created_at}-${i}`} emptyText="Chưa có lỗi nào được ghi nhận." />
    </Panel>
  );
}
