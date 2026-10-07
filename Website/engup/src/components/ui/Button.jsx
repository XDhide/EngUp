export default function Button({ variant = 'secondary', block, type = 'button', className = '', children, ...rest }) {
  const cls = ['btn', `btn--${variant}`, block && 'btn--block', className].filter(Boolean).join(' ');
  return <button type={type} className={cls} {...rest}>{children}</button>;
}

/** Nút dạng chữ trong hàng bảng: Sửa / Xóa / Khóa... */
export function LinkButton({ tone, className = '', children, ...rest }) {
  const cls = ['link-btn', tone && `link-btn--${tone}`, className].filter(Boolean).join(' ');
  return <button type="button" className={cls} {...rest}>{children}</button>;
}
