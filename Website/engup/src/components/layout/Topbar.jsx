import { Badge, Button } from '../ui';

export default function Topbar({ onToggleMenu }) {
  return (
    <header className="topbar">
      <div className="actions">
        <Button className="topbar__menu" onClick={onToggleMenu}>Menu</Button>
        <span className="topbar__title">Hệ thống quản trị</span>
      </div>
      <Badge tone="ok">Chế độ hoạt động</Badge>
    </header>
  );
}
