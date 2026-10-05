import { useState } from 'react';
import { EXAM_TYPES } from '../../constants';
import { useFormState } from '../../hooks/useFormState';
import { errorMessage, testsService } from '../../services';
import { Button, ErrorBanner, SelectField, TextField } from '../ui';

export default function TestSetModal({ testSet, onClose, onSaved }) {
  const editing = !!testSet?.id;
  const [v, bind] = useFormState({
    exam_type: testSet?.exam_type ?? '', section: testSet?.section ?? '', title: testSet?.title ?? '',
    time_limit_minutes: testSet?.time_limit_minutes ?? 60,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload = { exam_type: v.exam_type, section: v.section.trim(), title: v.title.trim(), time_limit_minutes: Number(v.time_limit_minutes) };
    try {
      if (editing) await testsService.updateSet(testSet.id, payload);
      else await testsService.createSet(payload);
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <form className="modal" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <div className="panel__head"><h2 className="panel__title">{editing ? 'Sửa bộ đề' : 'Tạo bộ đề mới'}</h2></div>
        <div className="panel__body">
          <ErrorBanner message={error} />
          {error && <div style={{ height: 16 }} />}
          <TextField label="Tên đề thi" required value={v.title} onChange={bind('title')} />
          <div className="form-row">
            <SelectField label="Loại kỳ thi" required options={EXAM_TYPES.map((t) => ({ value: t, label: t }))} value={v.exam_type} onChange={bind('exam_type')} />
            <TextField label="Phần thi" required placeholder="Reading, Part 5..." value={v.section} onChange={bind('section')} />
          </div>
          <TextField label="Thời gian làm bài (phút)" type="number" min="1" required value={v.time_limit_minutes} onChange={bind('time_limit_minutes')} />
        </div>
        <div className="panel__foot">
          <Button onClick={onClose} disabled={busy}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu đề thi'}</Button>
        </div>
      </form>
    </div>
  );
}
