import { useState } from 'react';
import { Button, ErrorBanner, LinkButton, Panel } from '../ui';
import { errorMessage } from '../../services';

/** Khung form bên phải của màn Học liệu: tự quản lý trạng thái đang lưu + lỗi. */
export default function FormPanel({ title, subtitle, submitLabel, onSubmit, onCancel, children }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmit();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handle}>
      <Panel title={title} subtitle={subtitle}
        action={<LinkButton tone="muted" onClick={onCancel}>Đóng</LinkButton>}
        footer={<><Button onClick={onCancel} disabled={busy}>Hủy</Button><Button type="submit" variant="primary" disabled={busy}>{busy ? 'Đang lưu...' : submitLabel}</Button></>}>
        <ErrorBanner message={error} />
        {error && <div style={{ height: 16 }} />}
        {children}
      </Panel>
    </form>
  );
}
