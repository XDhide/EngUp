import { useState } from 'react';
import { CONTENT_TYPE_LABELS } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { approvalService, errorMessage, readingService } from '../../services';
import { formatDateTime } from '../../utils/format';
import { Badge, Button, ErrorBanner, InfoNote, Panel, TextAreaField } from '../ui';

function ContentPreview({ item }) {
  const isReading = item.content_type === 'reading_article';
  const { data, loading, error } = useFetch(
    () => (isReading ? readingService.detail(item.content_id) : Promise.resolve(null)),
    [item.id],
  );

  if (!isReading) return <InfoNote>API hiện chưa trả nội dung từng câu hỏi chờ duyệt. Đối chiếu mã câu hỏi #{item.content_id} tại mục Đề thi.</InfoNote>;
  if (loading) return <p className="cell-sub">Đang tải nội dung...</p>;
  if (error || !data) return <InfoNote>Chưa xem trước được nội dung: bài đọc chờ duyệt chưa có trên API công khai.</InfoNote>;
  return (
    <>
      <p className="cell-strong" style={{ marginBottom: 8 }}>{data.title}</p>
      <div className="preview">{data.content}</div>
    </>
  );
}

/** Panel chi tiết yêu cầu + nút Duyệt / Từ chối. key={item.id} ở trang cha để reset form. */
export default function ApprovalDetail({ item, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn, message) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      onDone(message);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const reject = () => {
    if (!reason.trim()) { setError('Vui lòng nhập lý do từ chối.'); return; }
    run(() => approvalService.reject(item.id, reason.trim()), `Đã từ chối yêu cầu #${item.id}.`);
  };

  return (
    <Panel title="Chi tiết nội dung gửi duyệt" subtitle="Bản xem trước kiểm định"
      action={<Badge tone="off">Mã yêu cầu: #{item.id}</Badge>}
      footer={<><Button variant="danger" onClick={reject} disabled={busy}>Từ chối</Button>
        <Button variant="primary" disabled={busy} onClick={() => run(() => approvalService.approve(item.id), `Đã duyệt yêu cầu #${item.id}.`)}>Duyệt nội dung</Button></>}>
      <div className="kv" style={{ marginBottom: 24 }}>
        <div><p className="kv__label">Loại học liệu</p><p className="kv__value">{CONTENT_TYPE_LABELS[item.content_type] || item.content_type}</p></div>
        <div><p className="kv__label">Mã nội dung</p><p className="kv__value">#{item.content_id}</p></div>
        <div><p className="kv__label">Gửi lúc</p><p className="kv__value">{formatDateTime(item.created_at)}</p></div>
        <div><p className="kv__label">Trạng thái</p><p className="kv__value">Chờ duyệt</p></div>
      </div>
      <ContentPreview item={item} />
      <div style={{ marginTop: 24 }}>
        <ErrorBanner message={error} />
        {error && <div style={{ height: 16 }} />}
        <TextAreaField label="Lý do từ chối (bắt buộc khi từ chối):" rows={3} maxLength={500}
          placeholder="Nhập lý do gửi về tác giả nếu nội dung chưa đạt tiêu chuẩn..." value={reason} onChange={(e) => setReason(e.target.value)} />
        <p className="field__hint">Thao tác duyệt sẽ lập tức cập nhật tài liệu vào kho học liệu chung.</p>
      </div>
    </Panel>
  );
}
