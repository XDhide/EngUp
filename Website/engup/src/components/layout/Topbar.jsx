import { Badge } from '../ui';

export default function Topbar() {
  return (
    <header className="topbar">
      <span className="topbar__title">Hệ thống quản trị</span>
      <Badge tone="ok">Chế độ hoạt động</Badge>
    </header>
  );
}
