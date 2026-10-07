import { useState } from 'react';
import { createPortal } from 'react-dom';
import { errorMessage, readingService } from '../../services';
import { Button, ErrorBanner, SelectField, TextAreaField, TextField } from '../ui';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const strip = (o) => String(o ?? '').replace(/^\s*[A-F][.)]\s*/i, '');

export default function ReadingQuestionModal({ articleId, question, onClose, onSaved }) {
  const editing = !!question;
  const initial = (question?.options || []).map(strip);
  const [text, setText] = useState(question?.question_text ?? '');
  const [opts, setOpts] = useState(initial.length >= 2 ? initial : ['', '', '', '']);
  const [correct, setCorrect] = useState(question?.correct_answer ?? '');
  const [explanation, setExplanation] = useState(question?.explanation ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const filled = opts.map((o) => o.trim());
  const used = filled.map((o, i) => ({ letter: LETTERS[i], text: o })).filter((o) => o.text);

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    if (!text.trim()) return setError('Vui lòng nhập nội dung câu hỏi.');
    if (used.length < 2) return setError('Cần ít nhất 2 đáp án.');
    if (used.length !== filled.filter(Boolean).length || filled.slice(0, used.length).some((o) => !o)) return setError('Hãy điền các đáp án liên tiếp từ A, không để trống ở giữa.');
    if (new Set(used.map((o) => o.text.toLowerCase())).size !== used.length) return setError('Các đáp án không được trùng nhau.');
    if (!correct || !used.some((o) => o.letter === correct)) return setError('Hãy chọn đáp án đúng (phải là một đáp án đã nhập).');
    const payload = { question_text: text.trim(), options: used.map((o) => o.text), correct_answer: correct, explanation: explanation.trim() || null };
    setBusy(true);
    try {
      const saved = editing ? await readingService.updateQuestion(question.id, payload) : await readingService.addQuestion(articleId, payload);
      onSaved?.(saved);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return createPortal(
    <div className="backdrop" onClick={busy ? undefined : onClose}>
      <form className="modal modal--wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="panel__head"><h2 className="panel__title">{editing ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h2></div>
        <div className="panel__body">
          <ErrorBanner message={error} />
          {error && <div style={{ height: 12 }} />}
          <TextAreaField label="Nội dung câu hỏi" required rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="form-row">
            {opts.map((o, i) => (
              <TextField key={i} label={`Đáp án ${LETTERS[i]}`} value={o} onChange={(e) => setOpts((l) => l.map((x, j) => (j === i ? e.target.value : x)))} />
            ))}
          </div>
          {opts.length < 6 && <div style={{ marginBottom: 12 }}><Button onClick={() => setOpts((l) => [...l, ''])}>+ Thêm đáp án {LETTERS[opts.length]}</Button></div>}
          <SelectField label="Đáp án đúng" required placeholder="Chọn..." options={used.map((o) => ({ value: o.letter, label: `${o.letter}. ${o.text}` }))} value={correct} onChange={(e) => setCorrect(e.target.value)} />
          <TextAreaField label="Giải thích (không bắt buộc)" rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
        </div>
        <div className="panel__foot">
          <Button onClick={onClose} disabled={busy}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu câu hỏi'}</Button>
        </div>
      </form>
    </div>,
    document.body
  );
}
