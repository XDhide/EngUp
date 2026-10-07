import { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Badge, Button, DataTable, ErrorBanner, InfoNote, LinkButton, Panel, StatCard, SuccessBanner } from '../../components/ui';
import LevelBadge from '../../components/common/LevelBadge';
import DeleteDialog from '../../components/common/DeleteDialog';
import PlacementQuestionModal from '../../components/placement/PlacementQuestionModal';
import { CEFR_LEVELS } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { errorMessage, placementService } from '../../services';
import { formatDateTime } from '../../utils/format';

export default function PlacementPage() {
  const q = useFetch(() => placementService.list(), []);
  const st = useFetch(() => placementService.stats(), []);
  const [modal, setModal] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [notice, setNotice] = useState('');
  const [err, setErr] = useState('');

  const questions = q.data?.questions || [];
  const health = q.data?.health;
  const reloadAll = () => { q.reload(); st.reload(); };

  const toggle = async (item) => {
    setErr(''); setNotice('');
    try {
      await placementService.update(item.id, { is_active: !item.is_active });
      setNotice(item.is_active ? 'Đã tắt câu hỏi.' : 'Đã bật câu hỏi.');
      q.reload();
    } catch (e) { setErr(errorMessage(e)); }
  };

  const columns = [
    { key: 'order', header: '#', render: (x) => x.order_index },
    { key: 'level', header: 'Mức', render: (x) => <LevelBadge level={x.level} /> },
    { key: 'text', header: 'Câu hỏi', render: (x) => (
      <>
        <span className="cell-strong">{x.question_text}</span>
        <div className="cell-sub">{x.options.map((o) => `${o.id.toUpperCase()}. ${o.text}${o.id === x.correct_option_id ? ' ✔' : ''}`).join('   ')}</div>
      </>
    ) },
    { key: 'active', header: 'Trạng thái', render: (x) => <Badge tone={x.is_active ? 'ok' : 'off'}>{x.is_active ? 'Đang bật' : 'Đã tắt'}</Badge> },
    { key: 'action', header: 'Thao tác', align: 'right', render: (x) => (
      <span className="actions"><LinkButton onClick={() => setModal(x)}>Sửa</LinkButton><LinkButton tone="muted" onClick={() => toggle(x)}>{x.is_active ? 'Tắt' : 'Bật'}</LinkButton><LinkButton tone="danger" onClick={() => setRemoving(x)}>Xóa</LinkButton></span>
    ) },
  ];

  return (
    <>
      <PageHeader eyebrow="Quản lý khảo thí" title="Test đầu vào" description="Câu hỏi xếp trình độ cho người dùng mới. Thay đổi có hiệu lực ngay cho lượt làm bài tiếp theo."
        actions={<Button variant="primary" onClick={() => setModal({})}>Thêm câu hỏi</Button>} />
      <div className="stack">
        <ErrorBanner message={q.error || err} onRetry={q.error ? q.reload : undefined} />
        <SuccessBanner message={notice} />
        {health?.warnings?.map((w) => <InfoNote key={w}>⚠ {w}</InfoNote>)}
        <div className="grid-4">
          <StatCard label="Câu đang bật" value={health?.active_count ?? '—'} hint={`Tổng ${health?.total_count ?? 0} câu`} />
          <StatCard label="Lượt làm bài" value={st.data?.total_results ?? '—'} hint="Tổng số kết quả đã lưu" />
          <StatCard label="Phân bố câu theo mức" value={CEFR_LEVELS.map((l) => health?.per_level?.[l] ?? 0).join(' · ')} hint="A1 · A2 · B1 · B2 · C1 · C2" />
          <StatCard label="Kết quả theo mức" value={CEFR_LEVELS.map((l) => st.data?.by_level?.[l] ?? 0).join(' · ')} hint="A1 · A2 · B1 · B2 · C1 · C2" />
        </div>
        <Panel title="Ngân hàng câu hỏi" subtitle={health ? `Xếp trình độ theo % trả lời đúng: ${[...health.thresholds].reverse().map((t) => `${t.level} ≥ ${t.minPercent}%`).join(', ')}` : ''} bodyClass="">
          <DataTable columns={columns} rows={questions} loading={q.loading} emptyText="Chưa có câu hỏi nào. Người dùng sẽ dùng bộ câu hỏi mặc định cho tới khi bạn thêm câu hỏi." />
        </Panel>
        <Panel title="Kết quả gần đây" bodyClass="">
          <DataTable rows={st.data?.recent || []} loading={st.loading} emptyText="Chưa có ai làm bài test đầu vào."
            columns={[
              { key: 'u', header: 'Người dùng', render: (r) => r.user_name || `#${r.user_id}` },
              { key: 'l', header: 'Trình độ đề xuất', render: (r) => <LevelBadge level={r.suggested_level} /> },
              { key: 't', header: 'Thời gian', render: (r) => <span className="cell-sub">{formatDateTime(r.created_at)}</span> },
            ]} />
        </Panel>
      </div>
      {modal && <PlacementQuestionModal key={modal.id ?? 'new'} question={modal.id ? modal : null} onClose={() => setModal(null)}
        onSaved={() => { setNotice(modal.id ? 'Đã cập nhật câu hỏi.' : 'Đã thêm câu hỏi.'); setModal(null); reloadAll(); }} />}
      <DeleteDialog target={removing} label={removing ? `câu hỏi "${removing.question_text.slice(0, 40)}"` : ''} onClose={() => setRemoving(null)}
        onDelete={async (x) => { await placementService.remove(x.id); setNotice('Đã xóa câu hỏi.'); reloadAll(); }} />
    </>
  );
}
