import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout() {
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar />
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
