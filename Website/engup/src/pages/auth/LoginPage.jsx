import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { errorMessage } from '../../services';
import { Button, ErrorBanner, TextField } from '../../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login({ email: form.email.trim(), password: form.password });
    } catch (err) {
      setError(errorMessage(err, 'Thông tin đăng nhập hoặc mật khẩu không chính xác.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <h1 className="login__title">EngUp Admin</h1>
        <p className="login__sub">Hệ thống quản trị học liệu và người dùng</p>
        <ErrorBanner message={error} />
        <div>
          <TextField label="Email quản trị" type="email" autoComplete="username" placeholder="admin@engup.edu.vn" value={form.email} onChange={set('email')} required />
          <TextField label="Mật khẩu" type="password" autoComplete="current-password" placeholder="Nhập mật khẩu" value={form.password} onChange={set('password')} required />
        </div>
        <Button type="submit" variant="primary" block disabled={busy}>{busy ? 'Đang đăng nhập...' : 'Đăng nhập'}</Button>
      </form>
    </div>
  );
}
