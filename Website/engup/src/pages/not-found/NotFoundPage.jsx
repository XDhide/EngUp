import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="login">
      <div className="login__card">
        <h1 className="login__title">Không tìm thấy trang</h1>
        <p className="login__sub">Đường dẫn bạn truy cập không tồn tại.</p>
        <Link to="/">Về trang Tổng quan</Link>
      </div>
    </div>
  );
}
