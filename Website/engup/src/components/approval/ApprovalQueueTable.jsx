import { Badge, DataTable } from '../ui';
import { CONTENT_TYPE_LABELS } from '../../constants';
import { timeAgo } from '../../utils/format';

export default function ApprovalQueueTable({ items, selectedId, onSelect }) {
  const columns = [
    { key: 'type', header: 'Loại', render: (i) => `[${CONTENT_TYPE_LABELS[i.content_type] || i.content_type}]` },
    { key: 'content', header: 'Nội dung', render: (i) => (
      <><span className="cell-strong">Mã nội dung #{i.content_id}</span><div className="cell-sub">Yêu cầu #{i.id}</div></>
    ) },
    { key: 'created_at', header: 'Gửi lúc', render: (i) => <span className="cell-sub">{timeAgo(i.created_at)}</span> },
    { key: 'status', header: 'Trạng thái', render: () => <Badge tone="warn">Chờ duyệt</Badge> },
  ];
  return <DataTable columns={columns} rows={items} selectedId={selectedId} onRowClick={(i) => onSelect(i)} emptyText="Không có yêu cầu nào đang chờ duyệt." />;
}
