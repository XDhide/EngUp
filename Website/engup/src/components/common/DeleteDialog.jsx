import { useState } from 'react';
import { ConfirmDialog, ErrorBanner } from '../ui';
import { errorMessage } from '../../services';

/** Hộp thoại xác nhận xóa dùng chung: target = bản ghi cần xóa (null = đóng). */
export default function DeleteDialog({ target, label, onDelete, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onDelete(target);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDialog open={!!target} busy={busy} danger title="Xác nhận xóa" confirmText="Xóa"
      message={<><p>Bạn có chắc muốn xóa {label}? Thao tác này không thể hoàn tác.</p>{error && <div style={{ marginTop: 12 }}><ErrorBanner message={error} /></div>}</>}
      onConfirm={confirm} onCancel={() => { setError(''); onClose(); }} />
  );
}
