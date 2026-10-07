import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AdminLayout } from '../components/layout';
import { useAuth } from '../hooks/useAuth';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/admin/DashboardPage';
import UsersPage from '../pages/admin/UsersPage';
import ContentPage from '../pages/admin/ContentPage';
import ApprovalPage from '../pages/admin/ApprovalPage';
import TestsPage from '../pages/admin/TestsPage';
import LogsPage from '../pages/admin/LogsPage';
import PlacementPage from '../pages/admin/PlacementPage';
import SystemPage from '../pages/admin/SystemPage';
import NotFoundPage from '../pages/not-found/NotFoundPage';

export default function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="approval" element={<ApprovalPage />} />
          <Route path="tests" element={<TestsPage />} />
          <Route path="placement" element={<PlacementPage />} />
          <Route path="system" element={<SystemPage />} />
          <Route path="logs" element={<LogsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
