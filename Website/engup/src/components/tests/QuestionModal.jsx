import { useState } from 'react';
import { QUESTION_TYPES } from '../../constants';
import { clean, useFormState } from '../../hooks/useFormState';
import { errorMessage, testsService } from '../../services';
import { Button, ErrorBanner, SelectField, TextAreaField, TextField } from '../ui';

const LETTERS = ['A', 'B', 'C', 'D'];
const strip = (o) => o.replace(/^[A-Z]\.\s*/, '');

/** Backend lưu options dạng "A. nội dung" và correct_answer là chữ cái (khớp seed + Mobile). */
export default function QuestionModal({ testSetId, question, nextOrder, onClose, onSaved }) {
  const editing = !!question;
  const [v, bind] = useFormState({
    question_type: question?.question_type ?? 'multiple_choice',
    question_text: question?.question_text ?? '',
    correct_answer: '',
    passage_text: question?.passage_text ?? '',
    audio_url: question?.audio_url ?? '',
  });
  const [opts, setOpts] = useState(LETTERS.map((_, i) => strip(question?.options?.[i] ?? '')));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isMc = v.question_type === 'multiple_choice';
  const isFill = v.question_type === 'fill_blank';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const filled = opts.map((o, i) => ({ letter: LETTERS[i], text: o.trim() })).filter((o) => o.text);
    if (isMc && filled.length < 2) return setError('Câu trắc nghiệm cần ít nhất 2 đáp án.');
    if (!editing && (isMc || isFill) && !v.correct_answer.trim()) return setError('Vui lòng nhập đáp án đúng.');
    if (isMc && v.correct_answer && !filled.some((o) => o.letter === v.correct_answer)) return setError('Đáp án đúng phải là một đáp án đã nhập.');

    const payload = {
      question_type: v.question_type, question_text: v.question_text.trim(),
      options: isMc ? filled.map((o) => `${o.letter}. ${o.text}`) : null,
      passage_text: clean(v.passage_text), audio_url: clean(v.audio_url),
    };
    if (v.correct_answer.trim()) payload.correct_answer = v.correct_answer.trim();
    setBusy(true);
    try {
      const saved = editing
        ? await testsService.updateQuestion(question.id, payload)
        : await testsService.createQuestion({ ...payload, test_set_id: testSetId, order_index: nextOrder });
      onSaved(saved);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <form className="modal modal--wide" onSubmit={submit} onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="panel__head"><h2 className="panel__title">{editing ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h2></div>
        <div className="panel__body">
          <ErrorBanner message={error} />
          {error && <div style={{ height: 16 }} />}
          <SelectField label="Loại câu hỏi" required options={QUESTION_TYPES} value={v.question_type} onChange={bind('question_type')} />
          <TextAreaField label="Nội dung câu hỏi" required value={v.question_text} onChange={bind('question_text')} />
          {isMc && (
            <>
              <div className="form-row">
                {LETTERS.map((l, i) => (
                  <TextField key={l} label={`Đáp án ${l}`} value={opts[i]} onChange={(e) => setOpts((o) => o.map((x, j) => (j === i ? e.target.value : x)))} />
                ))}
              </div>
              <SelectField label="Đáp án đúng" required={!editing} placeholder="Chọn..." options={LETTERS.map((l) => ({ value: l, label: l }))}
                hint={editing ? 'Để trống nếu không đổi đáp án (API không trả đáp án hiện tại).' : undefined}
                value={v.correct_answer} onChange={bind('correct_answer')} />
            </>
          )}
          {isFill && (
            <TextField label="Đáp án đúng" required={!editing} value={v.correct_answer} onChange={bind('correct_answer')}
              hint={editing ? 'Để trống nếu không đổi. Chấm khớp chính xác, phân biệt hoa thường.' : 'Chấm khớp chính xác, phân biệt hoa thường.'} />
          )}
          <TextAreaField label="Đoạn văn / ngữ cảnh (không bắt buộc)" rows={3} value={v.passage_text} onChange={bind('passage_text')} />
          <TextField label="Đường dẫn audio (không bắt buộc)" placeholder="https://..." value={v.audio_url} onChange={bind('audio_url')} />
        </div>
        <div className="panel__foot">
          <Button onClick={onClose} disabled={busy}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu câu hỏi'}</Button>
        </div>
      </form>
    </div>
  );
}
