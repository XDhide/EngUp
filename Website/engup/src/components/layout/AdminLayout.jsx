import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="shell">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      <div className="main">
        <Topbar onToggleMenu={() => setMenuOpen((v) => !v)} />
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
