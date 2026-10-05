import { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Button, ConfirmDialog, ErrorBanner, Pagination, Panel, SuccessBanner } from '../../components/ui';
import UserFilters from '../../components/users/UserFilters';
import UserTable from '../../components/users/UserTable';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { useFetch } from '../../hooks/useFetch';
import { USERS_PAGE_SIZE, errorMessage, usersService } from '../../services';
import { downloadCsv, formatNumber } from '../../utils/format';

export default function UsersPage() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ ok: '', err: '' });
  const q = useDebounce(search.trim());

  const { data, loading, error, reload } = useFetch(
    () => usersService.list({ search: q, status, page }),
    [q, status, page],
  );

  const all = data?.users || [];
  // Backend chưa có bộ lọc trình độ nên lọc trên trang đang hiển thị.
  const users = level ? all.filter((u) => u.level_current === level) : all;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  const from = total ? (page - 1) * USERS_PAGE_SIZE + 1 : 0;

  const changeFilter = (setter) => (v) => { setter(v); setPage(1); };

  const confirmToggle = async () => {
    setBusy(true);
    setNotice({ ok: '', err: '' });
    try {
      await usersService.setStatus(target.id, !target.is_active);
      setNotice({ ok: `Đã ${target.is_active ? 'khóa' : 'mở khóa'} tài khoản ${target.email}.`, err: '' });
      setTarget(null);
      reload();
    } catch (e) {
      setNotice({ ok: '', err: errorMessage(e) });
      setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => downloadCsv('nguoi-dung.csv', [
    { label: 'Họ tên', get: (u) => u.full_name }, { label: 'Email', get: (u) => u.email },
    { label: 'Trình độ', get: (u) => u.level_current }, { label: 'Trạng thái', get: (u) => (u.is_active ? 'Hoạt động' : 'Đã khóa') },
    { label: 'Ngày tạo', get: (u) => u.created_at },
  ], users);

  return (
    <>
      <PageHeader eyebrow="Quản trị tài khoản" title="Người dùng"
        actions={<Button onClick={exportCsv} disabled={!users.length}>Xuất dữ liệu</Button>} />
      <div className="stack">
        <ErrorBanner message={error || notice.err} onRetry={error ? reload : undefined} />
        <SuccessBanner message={notice.ok} />
        <UserFilters search={search} status={status} level={level}
          onSearch={changeFilter(setSearch)} onStatus={changeFilter(setStatus)} onLevel={setLevel} />
        <Panel bodyClass="">
          <UserTable users={users} loading={loading} currentUserId={me?.id} onToggle={setTarget} />
          <Pagination page={page} totalPages={totalPages} onChange={setPage}
            summary={`Hiển thị ${from} - ${from ? from + all.length - 1 : 0} trong tổng số ${formatNumber(total)} người dùng`} />
        </Panel>
      </div>
      <ConfirmDialog open={!!target} busy={busy} danger={target?.is_active}
        title={target?.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        confirmText={target?.is_active ? 'Khóa' : 'Mở khóa'}
        message={target ? `Bạn có chắc muốn ${target.is_active ? 'khóa' : 'mở khóa'} tài khoản ${target.email}?` : ''}
        onConfirm={confirmToggle} onCancel={() => setTarget(null)} />
    </>
  );
}
