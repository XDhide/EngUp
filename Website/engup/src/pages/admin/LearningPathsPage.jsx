import { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Badge, Button, DataTable, ErrorBanner, LinkButton, Panel, SuccessBanner, FilterChips } from '../../components/ui';
import LevelBadge from '../../components/common/LevelBadge';
import DeleteDialog from '../../components/common/DeleteDialog';
import PathModal from '../../components/learning/PathModal';
import { useFetch } from '../../hooks/useFetch';
import { errorMessage, learningPathService } from '../../services';

const STATUS = {
  approved: { tone: 'ok', label: 'Đã duyệt' },
  pending: { tone: 'warn', label: 'Chờ duyệt' },
  rejected: { tone: 'err', label: 'Bị từ chối' },
};

export default function LearningPathsPage() {
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useFetch(() => learningPathService.list(status ? { status } : {}), [status]);
  const [modal, setModal] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [notice, setNotice] = useState('');
  const [err, setErr] = useState('');
  const paths = data?.paths || [];

  const openEdit = async (p) => {
    setErr('');
    try {
      setModal(await learningPathService.detail(p.id));
    } catch (e) {
      setErr(errorMessage(e));
    }
  };

  const columns = [
    { key: 'title', header: 'Lộ trình', render: (p) => (
      <>
        <span className="cell-strong">{p.title}</span>
        <div className="cell-sub">{p.is_official ? 'Chính thức (admin)' : `Người dùng: ${p.creator_name || '—'}`}</div>
      </>
    ) },
    { key: 'level', header: 'Cấp độ', render: (p) => (p.level ? <LevelBadge level={p.level} /> : '—') },
    { key: 'items', header: 'Nội dung', render: (p) => <span className="cell-sub">{p.item_counts.word} từ · {p.item_counts.reading} bài đọc · {p.item_counts.listening} bài nghe</span> },
    { key: 'status', header: 'Trạng thái', render: (p) => <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge> },
    { key: 'learners', header: 'Người học', render: (p) => (p.learners ? <><span className="cell-strong">{p.learners}</span><div className="cell-sub">TB hoàn thành {p.avg_completion_percent}% · {p.completed_learners} xong</div></> : <span className="cell-sub">0</span>) },
    { key: 'action', header: 'Thao tác', align: 'right', render: (p) => (
      <span className="actions"><LinkButton onClick={() => openEdit(p)}>Sửa</LinkButton><LinkButton tone="danger" onClick={() => setRemoving(p)}>Xóa</LinkButton></span>
    ) },
  ];

  return (
    <>
      <PageHeader eyebrow="Quản lý học liệu" title="Lộ trình học" description="Lộ trình gồm từ vựng và bài học theo thứ tự. Lộ trình admin tạo hiển thị ngay; lộ trình người dùng tạo cần duyệt ở mục Duyệt nội dung."
        actions={<Button variant="primary" onClick={() => setModal({})}>Tạo lộ trình</Button>} />
      <div className="stack">
        <ErrorBanner message={error || err} onRetry={error ? reload : undefined} />
        <SuccessBanner message={notice} />
        <Panel title="Danh sách lộ trình" action={<FilterChips value={status} onChange={setStatus} options={[{ value: '', label: 'Tất cả' }, { value: 'approved', label: 'Đã duyệt' }, { value: 'pending', label: 'Chờ duyệt' }]} />} bodyClass="">
          <DataTable columns={columns} rows={paths} loading={loading} emptyText="Chưa có lộ trình nào." />
        </Panel>
      </div>
      {modal && <PathModal key={modal.id ?? 'new'} path={modal.id ? modal : null} onClose={() => setModal(null)}
        onSaved={() => { setNotice(modal.id ? 'Đã cập nhật lộ trình.' : 'Đã tạo lộ trình.'); setModal(null); reload(); }} />}
      <DeleteDialog target={removing} label={removing ? `lộ trình "${removing.title}"` : ''} onClose={() => setRemoving(null)}
        onDelete={async (p) => { await learningPathService.remove(p.id); setNotice('Đã xóa lộ trình.'); reload(); }} />
    </>
  );
}
