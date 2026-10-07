import { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Badge, Button, ErrorBanner, InfoNote, Panel, SuccessBanner } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { errorMessage, systemService } from '../../services';
import { formatDateTime } from '../../utils/format';

const TONE = { ok: 'ok', warn: 'warn', fail: 'err', info: 'off' };
const LABEL = { ok: 'Tốt', warn: 'Cần chú ý', fail: 'Lỗi', info: 'Thông tin' };

function CheckList({ checks }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="stack" style={{ gap: 12 }}>
      {checks.map((c) => (
        <div key={c.key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Badge tone={TONE[c.status]}>{LABEL[c.status]}</Badge>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="cell-strong">{c.label}</p>
            <p className="cell-sub" style={{ whiteSpace: 'normal' }}>{c.message}</p>
            {c.data && (
              <>
                <button type="button" className="link-btn" onClick={() => setOpen(open === c.key ? null : c.key)}>{open === c.key ? 'Ẩn chi tiết' : 'Xem chi tiết'}</button>
                {open === c.key && <pre className="preview" style={{ maxHeight: 220, fontSize: 12 }}>{JSON.stringify(c.data, null, 2)}</pre>}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CheckPanel({ title, subtitle, fetcher, actions, summary }) {
  const { data, loading, error, reload } = useFetch(fetcher, []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ ok: '', err: '' });

  const act = async (fn) => {
    setBusy(true); setMsg({ ok: '', err: '' });
    try { const text = await fn(); setMsg({ ok: text, err: '' }); reload(); }
    catch (e) { setMsg({ ok: '', err: errorMessage(e) }); }
    finally { setBusy(false); }
  };

  return (
    <Panel title={title} subtitle={subtitle}
      action={<span className="actions">{data && <Badge tone={TONE[data.status]}>{LABEL[data.status]}</Badge>}<Button onClick={reload} disabled={loading || busy}>{loading ? 'Đang kiểm tra...' : 'Kiểm tra lại'}</Button></span>}
      footer={actions ? <>{actions(act, busy)}</> : null}>
      <ErrorBanner message={error} onRetry={reload} />
      <ErrorBanner message={msg.err} />
      <SuccessBanner message={msg.ok} />
      {(msg.ok || msg.err) && <div style={{ height: 12 }} />}
      {data && summary?.(data)}
      {loading && !data && <p className="cell-sub">Đang chạy kiểm tra...</p>}
      {data && <CheckList checks={data.checks} />}
      {data && <p className="field__hint" style={{ marginTop: 12 }}>Kiểm tra lúc {formatDateTime(data.generated_at)}</p>}
    </Panel>
  );
}

export default function SystemPage() {
  return (
    <>
      <PageHeader eyebrow="Vận hành" title="Kiểm tra hệ thống" description="Kiểm tra streak, thông báo cho người dùng và mô hình ML có đang hoạt động đúng không. Mỗi khung tự chạy khi mở trang." />
      <div className="stack">
        <CheckPanel title="Streak (chuỗi ngày học)" subtitle="Logic tính chuỗi, job chốt hằng ngày, dữ liệu có bị treo/lệch không"
          fetcher={() => systemService.checkStreak()}
          summary={(d) => (
            <>
              <p className="cell-sub" style={{ marginBottom: 12 }}>Hôm nay ({d.timezone}): {d.today} · {d.stats.with_streak}/{d.stats.students} học viên đang có chuỗi · chuỗi dài nhất hiện tại: {d.stats.longest_current} ngày</p>
            </>
          )}
          actions={(act, busy) => (
            <>
              <Button disabled={busy} onClick={() => act(async () => { const r = await systemService.runStreak(); return `Đã chốt ngày ${r.date}: ${r.active_users}/${r.total_users} người có học, ${r.lost_streaks} người mất chuỗi (${r.notified_lost} đã được thông báo).`; })}>Chạy lại cho hôm qua</Button>
            </>
          )} />
        <CheckPanel title="Thông báo cho người dùng" subtitle="Job nhắc học, push token, thông báo trong app, kết nối Expo"
          fetcher={() => systemService.checkNotifications()}
          actions={(act, busy) => (
            <>
              <Button disabled={busy} onClick={() => act(async () => { const r = await systemService.sendTestNotification(); return `Đã tạo thông báo thử cho ${r.user_name} (trong app). Push: ${r.push}${r.push_error ? ` — ${r.push_error}` : ''}. ${r.hint || ''}`; })}>Gửi thông báo thử cho tôi</Button>
              <Button disabled={busy} onClick={() => act(async () => { const r = await systemService.runReminder(); return `Quét khung ${r.bucket}: ${r.due} người đến giờ nhắc, đã tạo ${r.inapp} thông báo, push thành công ${r.push_sent}, lỗi ${r.push_failed}, chưa có token ${r.no_token}.`; })}>Chạy lượt nhắc học ngay</Button>
            </>
          )} />
        <CheckPanel title="Mô hình ML (dự đoán trí nhớ)" subtitle="Kết nối, model đã nạp, dự đoán có hợp lý không, độ chính xác trên dữ liệu thật"
          fetcher={() => systemService.checkMl()}
          summary={() => <InfoNote>Độ chính xác thực tế chỉ có ý nghĩa khi có ≥ 30 lượt ôn đã được đối chiếu; lúc đó hệ thống so sánh xác suất ML dự đoán với việc người dùng có nhớ thật không.</InfoNote>} />
      </div>
    </>
  );
}
