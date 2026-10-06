import { useState } from 'react';
import TopicModal from './TopicModal';

/**
 * Chọn chủ đề bằng thẻ trượt ngang. Thẻ đầu tiên luôn là "+ Thêm mới":
 * nếu không có chủ đề mong muốn thì bấm vào để mở cửa sổ nhỏ tạo chủ đề, tạo xong tự được chọn.
 * Bấm lại thẻ đang chọn để bỏ chọn (từ không thuộc chủ đề nào).
 */
export default function TopicPicker({ label = 'Chủ đề', topics, value, onChange, onTopicsChanged }) {
  const [adding, setAdding] = useState(false);
  const selected = value === '' || value === null || value === undefined ? '' : String(value);

  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="topic-slider" role="listbox" aria-label={label}>
        <button type="button" className="topic-card topic-card--add" onClick={() => setAdding(true)}>
          <span className="topic-card__plus">+</span>Thêm mới
        </button>
        {topics.map((t) => (
          <button key={t.id} type="button" role="option" aria-selected={selected === String(t.id)}
            className={`topic-card${selected === String(t.id) ? ' active' : ''}`}
            title={t.description || t.name}
            onClick={() => onChange(selected === String(t.id) ? '' : t.id)}>
            {t.name}
          </button>
        ))}
      </div>
      {!topics.length && <span className="field__hint">Chưa có chủ đề nào, bấm "Thêm mới" để tạo.</span>}
      {adding && (
        <TopicModal onClose={() => setAdding(false)}
          onSaved={(t) => { setAdding(false); onTopicsChanged?.(); onChange(t.id); }} />
      )}
    </div>
  );
}
