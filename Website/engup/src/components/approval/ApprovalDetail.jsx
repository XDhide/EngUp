import { useState } from 'react';
import { CONTENT_TYPE_LABELS } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { approvalService, errorMessage } from '../../services';
import { formatDateTime } from '../../utils/format';
import { Badge, Button, ErrorBanner, InfoNote, Panel, TextAreaField } from '../ui';

const isRight = (opt, answer) => String(opt).trim().toUpperCase().startsWith(`${String(answer).toUpperCase()}.`);

function Options({ options, answer }) {
  if (!options?.length) return null;
  return (
    <ul style={{ margin: '6px 0', paddingLeft: 18 }}>
      {options.map((o) => <li key={o} style={isRight(o, answer) ? { fontWeight: 600 } : undefined}>{o} {isRight(o, answer) && <Badge tone="ok">Đúng</Badge>}</li>)}
    </ul>
  );
}

function ContentPreview({ content }) {
  if (!content) return <InfoNote>Nội dung gốc không còn tồn tại (có thể đã bị xóa). Bạn chỉ có thể từ chối để dọn hàng đợi.</InfoNote>;
  if (content.kind === 'vocabulary_word') {
    return (
      <div className="kv">
        <div><p className="kv__label">Từ</p><p className="kv__value">{content.word}</p></div>
        <div><p className="kv__label">Phiên âm</p><p className="kv__value">{content.phonetic || '—'}</p></div>
        <div><p className="kv__label">Nghĩa</p><p className="kv__value">{content.meaning}</p></div>
        <div><p className="kv__label">Cấp độ / Chủ đề</p><p className="kv__value">{content.difficulty || '—'} / {content.topic_name || '—'}</p></div>
        <div style={{ gridColumn: '1 / -1' }}><p className="kv__label">Câu ví dụ</p><p className="kv__value">{content.example_sentence || '—'}</p></div>
      </div>
    );
  }
  if (content.kind === 'test_question') {
    return (
      <>
        {content.test_set && <p className="cell-sub">Thuộc đề: {content.test_set.exam_type} · {content.test_set.section} · {content.test_set.title}</p>}
        {content.passage_text && <div className="preview" style={{ maxHeight: 140, margin: '8px 0' }}>{content.passage_text}</div>}
        <p className="cell-strong">{content.question_text}</p>
        <Options options={content.options} answer={content.correct_answer} />
        {content.question_type === 'fill_blank' && <p className="cell-sub">Đáp án đúng: <b>{content.correct_answer}</b></p>}
      </>
    );
  }
  return (
    <>
      <p className="cell-strong" style={{ marginBottom: 4 }}>{content.title}</p>
      <p className="cell-sub" style={{ marginBottom: 8 }}>{content.difficulty || '—'} · {content.topic || 'Không có chủ đề'}</p>
      <div className="preview">{content.content}</div>
      <p className="cell-strong" style={{ margin: '16px 0 8px' }}>Câu hỏi ({content.questions?.length || 0})</p>
      {!content.questions?.length && <InfoNote>Bài đọc chưa có câu hỏi. Có thể duyệt rồi thêm câu hỏi tại Học liệu → Bài đọc.</InfoNote>}
      {content.questions?.map((q, i) => (
        <div key={q.id} style={{ marginBottom: 12 }}>
          <p>Câu {i + 1}. {q.question_text}</p>
          <Options options={q.options} answer={q.correct_answer} />
          {q.explanation && <p className="cell-sub">Giải thích: {q.explanation}</p>}
        </div>
      ))}
    </>
  );
}

/** Panel chi tiết yêu cầu + nút Duyệt / Từ chối. key={item.id} ở trang cha để reset form. */
export default function ApprovalDetail({ item, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { data, loading, error: loadError } = useFetch(() => approvalService.detail(item.id), [item.id]);

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
        <Button variant="primary" disabled={busy || loading || !data?.content} onClick={() => run(() => approvalService.approve(item.id), `Đã duyệt yêu cầu #${item.id}.`)}>Duyệt nội dung</Button></>}>
      <div className="kv" style={{ marginBottom: 24 }}>
        <div><p className="kv__label">Loại học liệu</p><p className="kv__value">{CONTENT_TYPE_LABELS[item.content_type] || item.content_type}</p></div>
        <div><p className="kv__label">Người gửi</p><p className="kv__value">{item.submitter_name || 'AI / hệ thống'}</p></div>
        <div><p className="kv__label">Gửi lúc</p><p className="kv__value">{formatDateTime(item.created_at)}</p></div>
        <div><p className="kv__label">Mã nội dung</p><p className="kv__value">#{item.content_id}</p></div>
      </div>
      <ErrorBanner message={loadError} />
      {loading ? <p className="cell-sub">Đang tải nội dung...</p> : !loadError && <ContentPreview content={data?.content} />}
      <div style={{ marginTop: 24 }}>
        <ErrorBanner message={error} />
        {error && <div style={{ height: 16 }} />}
        <TextAreaField label="Lý do từ chối (bắt buộc khi từ chối):" rows={3} maxLength={500}
          placeholder="Nhập lý do gửi về tác giả nếu nội dung chưa đạt tiêu chuẩn..." value={reason} onChange={(e) => setReason(e.target.value)} />
        <p className="field__hint">Duyệt sẽ hiển thị nội dung cho mọi học viên. Người gửi sẽ nhận thông báo kết quả trong app.</p>
      </div>
    </Panel>
  );
}
