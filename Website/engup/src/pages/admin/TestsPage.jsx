import { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Button, ErrorBanner, Panel, SuccessBanner } from '../../components/ui';
import DeleteDialog from '../../components/common/DeleteDialog';
import TestSetTable from '../../components/tests/TestSetTable';
import TestSetModal from '../../components/tests/TestSetModal';
import QuestionEditor from '../../components/tests/QuestionEditor';
import AttemptStatsPanel from '../../components/tests/AttemptStatsPanel';
import { useFetch } from '../../hooks/useFetch';
import { testsService } from '../../services';

export default function TestsPage() {
  const { data: sets, loading, error, reload } = useFetch(() => testsService.listAll(), []);
  const [editor, setEditor] = useState(null);
  const [stats, setStats] = useState(null);
  const [setModal, setSetModal] = useState(null); // null | {} (tạo) | testSet (sửa)
  const [removing, setRemoving] = useState(null);
  const [notice, setNotice] = useState('');

  const openEditor = (s) => { setStats(null); setEditor(s); };
  const openStats = (s) => { setEditor(null); setStats(s); };

  return (
    <>
      <PageHeader eyebrow="Quản lý khảo thí" title="Đề thi" actions={<Button variant="primary" onClick={() => setSetModal({})}>Tạo bộ đề mới</Button>} />
      <div className="stack">
        <ErrorBanner message={error} onRetry={reload} />
        <SuccessBanner message={notice} />
        <Panel title="Danh sách bộ đề khảo sát và định kỳ" subtitle="Toàn bộ ngân hàng đề được cấu hình và sử dụng trong hệ thống học tập"
          action={<span className="cell-sub">Tổng số: {sets?.length ?? 0} bộ đề</span>} bodyClass="">
          <TestSetTable sets={sets || []} loading={loading} activeId={editor?.id}
            onEditQuestions={openEditor} onStats={openStats} onEditSet={setSetModal} onRemove={setRemoving} />
        </Panel>
        {editor && <QuestionEditor key={editor.id} testSet={editor} onClose={() => setEditor(null)} />}
        {stats && <AttemptStatsPanel key={stats.id} testSet={stats} onClose={() => setStats(null)} />}
      </div>
      {setModal && <TestSetModal key={setModal.id ?? 'new'} testSet={setModal.id ? setModal : null} onClose={() => setSetModal(null)}
        onSaved={() => { setNotice(setModal.id ? 'Đã cập nhật bộ đề.' : 'Đã tạo bộ đề mới.'); setSetModal(null); reload(); }} />}
      <DeleteDialog target={removing} label={removing ? `bộ đề "${removing.title}" cùng toàn bộ câu hỏi` : ''} onClose={() => setRemoving(null)}
        onDelete={async (s) => { await testsService.removeSet(s.id); if (editor?.id === s.id) setEditor(null); if (stats?.id === s.id) setStats(null); setNotice('Đã xóa bộ đề.'); reload(); }} />
    </>
  );
}
