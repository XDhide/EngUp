import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CEFR_OPTIONS } from '../../constants';
import { errorMessage, placementService } from '../../services';
import { Button, ErrorBanner, SelectField, TextAreaField, TextField } from '../ui';

const IDS = ['a', 'b', 'c', 'd', 'e', 'f'];

export default function PlacementQuestionModal({ question, onClose, onSaved }) {
  const editing = !!question;
  const [level, setLevel] = useState(question?.level ?? '');
  const [text, setText] = useState(question?.question_text ?? '');
  const [opts, setOpts] = useState(question?.options?.map((o) => o.text) ?? ['', '', '', '']);
  const [correct, setCorrect] = useState(question?.correct_option_id ?? '');
  const [active, setActive] = useState(question?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const used = opts.map((o, i) => ({ id: IDS[i], text: o.trim() })).filter((o) => o.text);

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    if (!level) return setError('Hãy chọn mức CEFR của câu hỏi.');
    if (!text.trim()) return setError('Vui lòng nhập nội dung câu hỏi.');
    if (used.length < 2) return setError('Cần ít nhất 2 đáp án.');
    if (opts.slice(0, used.length).some((o) => !o.trim())) return setError('Hãy điền các đáp án liên tiếp từ A, không để trống ở giữa.');
    if (new Set(used.map((o) => o.text.toLowerCase())).size !== used.length) return setError('Các đáp án không được trùng nhau.');
    if (!used.some((o) => o.id === correct)) return setError('Hãy chọn đáp án đúng.');
    const payload = { level, question_text: text.trim(), options: used.map((o) => ({ text: o.text })), correct_option_id: correct, is_active: active };
    setBusy(true);
    try {
      const saved = editing ? await placementService.update(question.id, payload) : await placementService.create(payload);
      onSaved?.(saved);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return createPortal(
    <div className="backdrop" onClick={busy ? undefined : onClose}>
      <form className="modal modal--wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="panel__head"><h2 className="panel__title">{editing ? 'Sửa câu hỏi test đầu vào' : 'Thêm câu hỏi test đầu vào'}</h2></div>
        <div className="panel__body">
          <ErrorBanner message={error} />
          {error && <div style={{ height: 12 }} />}
          <SelectField label="Mức độ (CEFR)" required options={CEFR_OPTIONS} value={level} onChange={(e) => setLevel(e.target.value)} />
          <TextAreaField label="Nội dung câu hỏi" required rows={3} placeholder="Ví dụ: She ___ to school every day." value={text} onChange={(e) => setText(e.target.value)} />
          <div className="form-row">
            {opts.map((o, i) => <TextField key={i} label={`Đáp án ${IDS[i].toUpperCase()}`} value={o} onChange={(e) => setOpts((l) => l.map((x, j) => (j === i ? e.target.value : x)))} />)}
          </div>
          {opts.length < 6 && <div style={{ marginBottom: 12 }}><Button onClick={() => setOpts((l) => [...l, ''])}>+ Thêm đáp án {IDS[opts.length].toUpperCase()}</Button></div>}
          <SelectField label="Đáp án đúng" required options={used.map((o) => ({ value: o.id, label: `${o.id.toUpperCase()}. ${o.text}` }))} value={correct} onChange={(e) => setCorrect(e.target.value)} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Đang bật (hiển thị cho người dùng làm bài)
          </label>
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
