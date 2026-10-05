import { Badge, DataTable, LinkButton } from '../ui';
import LevelBadge from '../common/LevelBadge';

export default function UserTable({ users, loading, currentUserId, onToggle }) {
  const columns = [
    { key: 'full_name', header: 'Họ tên', render: (u) => <span className="cell-strong">{u.full_name}</span> },
    { key: 'email', header: 'Email', render: (u) => <span style={{ color: 'var(--text-muted)' }}>{u.email}</span> },
    { key: 'level_current', header: 'Trình độ', render: (u) => <LevelBadge level={u.level_current} /> },
    { key: 'is_active', header: 'Trạng thái', render: (u) => <Badge tone={u.is_active ? 'ok' : 'off'}>{u.is_active ? 'Hoạt động' : 'Đã khóa'}</Badge> },
    {
      key: 'action', header: 'Hành động', align: 'right',
      render: (u) => (u.is_active
        ? <LinkButton tone="danger" disabled={u.id === currentUserId} onClick={() => onToggle(u)}>Khóa</LinkButton>
        : <LinkButton onClick={() => onToggle(u)}>Mở khóa</LinkButton>),
    },
  ];
  return <DataTable columns={columns} rows={users} loading={loading} emptyText="Không tìm thấy người dùng phù hợp." />;
}
