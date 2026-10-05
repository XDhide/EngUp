import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { LinkButton } from '../ui';

export default function Sidebar({ open, onNavigate }) {
  const { user, logout } = useAuth();
  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar__brand">EngUp Admin</div>
      <nav className="sidebar__nav">
        <div className="sidebar__group">Hệ thống</div>
        {NAV_ITEMS.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className="sidebar__link" onClick={onNavigate}>{n.label}</NavLink>
        ))}
      </nav>
      <div className="sidebar__foot">
        <span className="sidebar__email">{user?.email}</span>
        <div className="sidebar__row">
          <span>Quản trị viên</span>
          <LinkButton onClick={logout}>Đăng xuất</LinkButton>
        </div>
      </div>
    </aside>
  );
}
