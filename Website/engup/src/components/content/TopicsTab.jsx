import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { vocabularyService } from '../../services';
import { Button, DataTable, ErrorBanner, LinkButton, Panel } from '../ui';
import DeleteDialog from '../common/DeleteDialog';
import TopicModal from './TopicModal';

/** Tab quản lý chủ đề từ vựng: thêm / sửa / xóa. */
export default function TopicsTab({ onChanged }) {
  const { data, loading, error, reload } = useFetch(() => vocabularyService.topics(), []);
  const [modal, setModal] = useState(null); // null | {} (thêm) | topic (sửa)
  const [removing, setRemoving] = useState(null);
  const topics = data?.topics || [];
  const refresh = () => { reload(); onChanged?.(); };

  const columns = [
    { key: 'name', header: 'Tên chủ đề', render: (t) => <span className="cell-strong">{t.name}</span> },
    { key: 'description', header: 'Mô tả', render: (t) => t.description || '—' },
    { key: 'action', header: 'Thao tác', align: 'right', render: (t) => (
      <span className="actions"><LinkButton onClick={() => setModal(t)}>Sửa</LinkButton><LinkButton tone="danger" onClick={() => setRemoving(t)}>Xóa</LinkButton></span>
    ) },
  ];

  return (
    <div className="stack">
      <ErrorBanner message={error} onRetry={reload} />
      <Panel bodyClass="" title="Chủ đề từ vựng" subtitle="Xóa chủ đề không xóa từ vựng, các từ đó chỉ trở thành chưa có chủ đề"
        action={<Button variant="primary" onClick={() => setModal({})}>Thêm chủ đề</Button>}>
        <DataTable columns={columns} rows={topics} loading={loading} emptyText="Chưa có chủ đề nào." />
      </Panel>
      {modal && <TopicModal topic={modal.id ? modal : null} onClose={() => setModal(null)} onSaved={() => { setModal(null); refresh(); }} />}
      <DeleteDialog target={removing} label={removing ? `chủ đề "${removing.name}"` : ''} onClose={() => setRemoving(null)}
        onDelete={async (t) => { await vocabularyService.removeTopic(t.id); refresh(); }} />
    </div>
  );
}
