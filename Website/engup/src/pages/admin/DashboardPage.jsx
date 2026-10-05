import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { ErrorBanner, StatCard } from '../../components/ui';
import RecentErrorsTable from '../../components/dashboard/RecentErrorsTable';
import { useFetch } from '../../hooks/useFetch';
import { approvalService, dashboardService } from '../../services';
import { formatNumber } from '../../utils/format';

export default function DashboardPage() {
  const { data, loading, error, reload } = useFetch(async () => {
    const [overview, pending] = await Promise.all([dashboardService.getOverview(), approvalService.pending()]);
    return { overview, pendingCount: pending.items?.length ?? 0 };
  }, []);

  const o = data?.overview;
  const dash = (v) => (loading ? '...' : v);

  return (
    <>
      <PageHeader title="Tổng quan" description="Tóm lược số liệu vận hành và hoạt động học tập trên hệ thống" />
      <div className="stack">
        <ErrorBanner message={error} onRetry={reload} />
        <div className="grid-4">
          <StatCard label="Tổng người dùng" value={dash(formatNumber(o?.total_users))} hint="Toàn bộ tài khoản trên hệ thống" />
          <StatCard label="Hoạt động hôm nay" value={dash(formatNumber(o?.daily_active_users))} hint="Người dùng đang học" />
          <StatCard label="Tỷ lệ hoàn thành đề thi" value={dash(o ? `${o.completion_rate}%` : '—')} hint="Lượt làm bài đã nộp / tổng lượt" />
          <StatCard label="Bài chờ duyệt" value={dash(formatNumber(data?.pendingCount))}
            hint={data?.pendingCount > 0 ? <Link to="/approval">Học liệu và đề kiểm tra</Link> : 'Không có yêu cầu nào'} warn={data?.pendingCount > 0} />
        </div>
        <RecentErrorsTable errors={o?.recent_errors || []} />
      </div>
    </>
  );
}
