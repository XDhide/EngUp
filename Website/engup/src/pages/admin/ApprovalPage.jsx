import { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Badge, ErrorBanner, Pagination, Panel, SuccessBanner, Tabs } from '../../components/ui';
import ApprovalQueueTable from '../../components/approval/ApprovalQueueTable';
import ApprovalDetail from '../../components/approval/ApprovalDetail';
import { useFetch } from '../../hooks/useFetch';
import { approvalService } from '../../services';

const PAGE_SIZE = 6;

export default function ApprovalPage() {
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');

  const { data, loading, error, reload } = useFetch(() => approvalService.pending(), []);
  const items = data?.items || [];
  const count = (t) => items.filter((i) => i.content_type === t).length;
  const shown = tab === 'all' ? items : items.filter((i) => i.content_type === tab);
  const rows = shown.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from = shown.length ? (page - 1) * PAGE_SIZE + 1 : 0;

  const tabs = [
    { key: 'all', label: `Tất cả (${items.length})` },
    { key: 'reading_article', label: `Bài đọc (${count('reading_article')})` },
    { key: 'test_question', label: `Câu hỏi đề thi (${count('test_question')})` },
    { key: 'vocabulary_word', label: `Từ vựng (${count('vocabulary_word')})` },
    { key: 'learning_path', label: `Lộ trình (${count('learning_path')})` },
  ];

  return (
    <>
      <PageHeader title="Duyệt nội dung" description="Kiểm tra, xác minh tính chuẩn xác của tài liệu học tập từ giáo viên và cộng đồng"
        actions={<span className="actions">Phiên làm việc: <Badge tone="ok">Tự động đồng bộ</Badge></span>} />
      <div className="stack">
        <ErrorBanner message={error} onRetry={reload} />
        <SuccessBanner message={notice} />
        <Tabs items={tabs} value={tab} onChange={(t) => { setTab(t); setPage(1); setSelected(null); }} />
        <div className="split">
          <Panel title="Hàng đợi kiểm duyệt" action={<span className="cell-sub">{shown.length} yêu cầu</span>} bodyClass="">
            {loading && !items.length ? <div className="state">Đang tải dữ liệu...</div>
              : <ApprovalQueueTable items={rows} selectedId={selected?.id} onSelect={setSelected} />}
            <Pagination page={page} totalPages={Math.max(1, Math.ceil(shown.length / PAGE_SIZE))} onChange={setPage}
              summary={`Hiển thị ${from} - ${from ? from + rows.length - 1 : 0} trong tổng số ${shown.length} mục`} />
          </Panel>
          {selected
            ? <ApprovalDetail key={selected.id} item={selected} onDone={(m) => { setNotice(m); setSelected(null); reload(); }} />
            : <Panel title="Chi tiết nội dung gửi duyệt"><p className="state">Chọn một yêu cầu trong hàng đợi để xem chi tiết.</p></Panel>}
        </div>
      </div>
    </>
  );
}
