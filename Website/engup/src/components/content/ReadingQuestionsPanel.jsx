import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { readingService } from '../../services';
import { Badge, Button, ErrorBanner, InfoNote, LinkButton, Panel } from '../ui';
import DeleteDialog from '../common/DeleteDialog';
import ReadingQuestionModal from './ReadingQuestionModal';

export default function ReadingQuestionsPanel({ article, onClose, onChanged }) {
  const { data, loading, error, reload } = useFetch(() => readingService.adminDetail(article.id), [article.id]);
  const [modal, setModal] = useState(null);
  const [removing, setRemoving] = useState(null);
  const questions = data?.questions || [];
  const refresh = () => { reload(); onChanged?.(); };

  return (
    <Panel title="Câu hỏi bài đọc" subtitle={article.title}
      action={<LinkButton tone="muted" onClick={onClose}>Đóng</LinkButton>}
      footer={<Button variant="primary" onClick={() => setModal({})}>Thêm câu hỏi</Button>}>
      <ErrorBanner message={error} onRetry={reload} />
      {loading && !questions.length && <p className="cell-sub">Đang tải câu hỏi...</p>}
      {!loading && !error && !questions.length && <InfoNote>Bài đọc này chưa có câu hỏi. Học viên chỉ đọc được, chưa làm bài được. Bấm “Thêm câu hỏi” để tạo.</InfoNote>}
      <div className="stack">
        {questions.map((q, i) => (
          <div key={q.id} className="panel" style={{ padding: 12 }}>
            <p className="cell-strong">Câu {i + 1}. {q.question_text}</p>
            <ul style={{ margin: '8px 0', paddingLeft: 18 }}>
              {(q.options || []).map((o) => {
                const isCorrect = String(o).trim().toUpperCase().startsWith(`${q.correct_answer}.`);
                return <li key={o} style={isCorrect ? { fontWeight: 600 } : undefined}>{o} {isCorrect && <Badge tone="ok">Đúng</Badge>}</li>;
              })}
            </ul>
            {q.explanation && <p className="cell-sub">Giải thích: {q.explanation}</p>}
            <span className="actions"><LinkButton onClick={() => setModal(q)}>Sửa</LinkButton><LinkButton tone="danger" onClick={() => setRemoving(q)}>Xóa</LinkButton></span>
          </div>
        ))}
      </div>
      {modal && <ReadingQuestionModal articleId={article.id} question={modal.id ? modal : null} onClose={() => setModal(null)} onSaved={() => { setModal(null); refresh(); }} />}
      <DeleteDialog target={removing} label={removing ? 'câu hỏi này' : ''} onClose={() => setRemoving(null)}
        onDelete={async (q) => { await readingService.removeQuestion(q.id); refresh(); }} />
    </Panel>
  );
}
