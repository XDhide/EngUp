import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { errorMessage, testsService } from '../../services';
import { Button, ErrorBanner, Panel, SuccessBanner } from '../ui';
import DeleteDialog from '../common/DeleteDialog';
import QuestionCard from './QuestionCard';
import QuestionModal from './QuestionModal';

/** Biên tập câu hỏi của một bộ đề: thêm/sửa/xóa + đổi thứ tự (Lên/Xuống) rồi "Lưu thay đổi thứ tự". */
export default function QuestionEditor({ testSet, onClose }) {
  const { data, loading, error, reload } = useFetch(() => testsService.questions(testSet.id), [testSet.id]);
  const [order, setOrder] = useState(null); // null = đúng thứ tự từ server
  const [answers, setAnswers] = useState({}); // id -> đáp án đúng đã biết trong phiên
  const [modal, setModal] = useState(null); // null | {} (thêm) | question (sửa)
  const [removing, setRemoving] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ ok: '', err: '' });

  const original = data?.questions || [];
  const items = order ?? original;
  const dirty = items.some((q, i) => q.id !== original[i]?.id);
  const refresh = () => { setOrder(null); reload(); };
  const nextOrder = original.length ? Math.max(...original.map((q) => q.order_index)) + 1 : 1;

  const move = (i, d) => setOrder((list) => {
    const next = [...(list ?? original)];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    return next;
  });

  const saveOrder = async () => {
    setSaving(true);
    setMsg({ ok: '', err: '' });
    try {
      const slots = original.map((q) => q.order_index); // gán lại đúng các vị trí order_index đang có
      await Promise.all(items.map((q, i) => (q.order_index !== slots[i] ? testsService.updateQuestion(q.id, { order_index: slots[i] }) : null)));
      setMsg({ ok: 'Đã lưu thứ tự câu hỏi.', err: '' });
      refresh();
    } catch (e) {
      setMsg({ ok: '', err: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  const onSaved = (saved) => {
    if (saved?.id && saved.correct_answer) setAnswers((a) => ({ ...a, [saved.id]: saved.correct_answer }));
    setModal(null);
    refresh();
  };

  return (
    <div className="stack">
      <Panel title={`Chỉnh sửa: ${testSet.title}`} subtitle="Đang chỉnh sửa bộ đề" bodyClass=""
        action={<span className="actions"><Button onClick={onClose}>Đóng trình soạn</Button>
          <Button variant="primary" onClick={saveOrder} disabled={!dirty || saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi thứ tự'}</Button></span>} />
      <ErrorBanner message={error || msg.err} onRetry={error ? reload : undefined} />
      <SuccessBanner message={msg.ok} />
      <p className="cell-sub">Danh sách câu hỏi trong đề (dùng liên kết <b>Lên</b> / <b>Xuống</b> để thay đổi thứ tự câu hỏi)</p>
      {loading && !items.length && <div className="state">Đang tải câu hỏi...</div>}
      {items.map((q, i) => (
        <QuestionCard key={q.id} index={i} question={q} correctAnswer={answers[q.id]} isFirst={i === 0} isLast={i === items.length - 1}
          onUp={() => move(i, -1)} onDown={() => move(i, 1)} onEdit={() => setModal(q)} onRemove={() => setRemoving(q)} />
      ))}
      {!loading && !items.length && !error && <div className="state">Đề này chưa có câu hỏi.</div>}
      <div><Button onClick={() => setModal({})}>Thêm câu hỏi mới</Button></div>

      {modal && <QuestionModal key={modal.id ?? 'new'} testSetId={testSet.id} question={modal.id ? modal : null} nextOrder={nextOrder} onClose={() => setModal(null)} onSaved={onSaved} />}
      <DeleteDialog target={removing} label={removing ? `câu hỏi #${removing.id}` : ''} onClose={() => setRemoving(null)}
        onDelete={async (q) => { await testsService.removeQuestion(q.id); refresh(); }} />
    </div>
  );
}
