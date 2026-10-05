/** tone: ok (Hoạt động) | off (Đã khóa) | warn (Chờ duyệt) | err (Lỗi) */
export default function Badge({ tone = 'off', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
