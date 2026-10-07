import { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Button, Tabs } from '../../components/ui';
import ErrorLogsTab from '../../components/logs/ErrorLogsTab';
import AuditLogsTab from '../../components/logs/AuditLogsTab';

const TABS = [{ key: 'errors', label: 'Lỗi hệ thống' }, { key: 'audit', label: 'Audit log' }];

export default function LogsPage() {
  const [tab, setTab] = useState('errors');
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <>
      <PageHeader eyebrow="Giám sát & an toàn hạ tầng" title="Nhật ký"
        actions={<Button variant="primary" onClick={() => setRefreshKey((k) => k + 1)}>Làm mới dữ liệu</Button>} />
      <Tabs items={TABS} value={tab} onChange={setTab} />
      {tab === 'errors' ? <ErrorLogsTab refreshKey={refreshKey} /> : <AuditLogsTab refreshKey={refreshKey} />}
    </>
  );
}
