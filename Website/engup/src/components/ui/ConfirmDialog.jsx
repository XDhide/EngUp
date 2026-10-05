import Button from './Button';

export default function ConfirmDialog({ open, title, message, confirmText = 'Xác nhận', danger, busy, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="panel__head"><h2 className="panel__title">{title}</h2></div>
        <div className="panel__body">{message}</div>
        <div className="panel__foot">
          <Button onClick={onCancel} disabled={busy}>Hủy</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>{busy ? 'Đang xử lý...' : confirmText}</Button>
        </div>
      </div>
    </div>
  );
}
