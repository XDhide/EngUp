import { QUESTION_TYPES } from '../../constants';
import { LinkButton } from '../ui';

/** Đáp án đúng chỉ hiển thị khi biết (câu vừa tạo/sửa trong phiên): API học viên không trả correct_answer. */
export default function QuestionCard({ index, question, correctAnswer, isFirst, isLast, onUp, onDown, onEdit, onRemove }) {
  const typeLabel = QUESTION_TYPES.find((t) => t.value === question.question_type)?.label || question.question_type;
  const isCorrect = (opt) => correctAnswer && opt.trim().toUpperCase().startsWith(`${String(correctAnswer).toUpperCase()}.`);
  return (
    <div className="q-card">
      <div>
        <p className="q-card__head">{index + 1}. Câu {index + 1}<span className="q-card__tag">{typeLabel}</span></p>
        {question.passage_text && <div className="preview" style={{ maxHeight: 120, marginBottom: 12 }}>{question.passage_text}</div>}
        <p className="q-card__text">{question.question_text}</p>
        {question.options?.length > 0 && (
          <div className="q-card__opts">
            {question.options.map((o) => (
              <div key={o} className={`q-opt${isCorrect(o) ? ' q-opt--ok' : ''}`}>{o}{isCorrect(o) && ' [Đáp án đúng]'}</div>
            ))}
          </div>
        )}
        {question.question_type === 'fill_blank' && correctAnswer && <p className="cell-sub">Đáp án đúng: {correctAnswer}</p>}
      </div>
      <div className="actions" style={{ alignSelf: 'center' }}>
        <LinkButton tone="muted" disabled={isFirst} onClick={onUp}>Lên</LinkButton><span className="sep" />
        <LinkButton tone="muted" disabled={isLast} onClick={onDown}>Xuống</LinkButton><span className="sep" />
        <LinkButton onClick={onEdit}>Sửa</LinkButton><span className="sep" />
        <LinkButton tone="danger" onClick={onRemove}>Xóa</LinkButton>
      </div>
    </div>
  );
}
