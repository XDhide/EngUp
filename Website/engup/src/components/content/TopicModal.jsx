import { useState } from 'react';
import { createPortal } from 'react-dom';
import { errorMessage, vocabularyService } from '../../services';
import { Button, ErrorBanner, TextAreaField, TextField } from '../ui';

/** Cửa sổ nhỏ thêm / sửa chủ đề. topic = null -> thêm mới. onSaved(topic) nhận chủ đề vừa lưu. */
export default function TopicModal({ topic, onClose, onSaved }) {
  const [name, setName] = useState(topic?.name ?? '');
  const [description, setDescription] = useState(topic?.description ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) { setError('Vui lòng nhập tên chủ đề.'); return; }
    setBusy(true); setError('');
    try {
      const payload = { name: name.trim(), description: description.trim() || null };
      const saved = topic ? await vocabularyService.updateTopic(topic.id, payload) : await vocabularyService.createTopic(payload);
      onSaved?.(saved);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return createPortal(
    <div className="backdrop" onClick={busy ? undefined : onClose}>
      <form className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} onSubmit={submit} onKeyDown={(e) => e.stopPropagation()}>
        <div className="panel__head"><h2 className="panel__title">{topic ? 'Sửa chủ đề' : 'Thêm chủ đề mới'}</h2></div>
        <div className="panel__body">
          <ErrorBanner message={error} />
          {error && <div style={{ height: 12 }} />}
          <TextField label="Tên chủ đề" required autoFocus maxLength={150} placeholder="Ví dụ: Du lịch" value={name} onChange={(e) => setName(e.target.value)} />
          <TextAreaField label="Mô tả" rows={3} maxLength={500} placeholder="Mô tả ngắn (không bắt buộc)" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="panel__foot">
          <Button onClick={onClose} disabled={busy}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu chủ đề'}</Button>
        </div>
      </form>
    </div>,
    document.body
  );
}
