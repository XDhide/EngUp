import { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Badge, Button, ConfirmDialog, ErrorBanner, InfoNote, Panel, SelectField, SuccessBanner, TextAreaField, TextField } from '../../components/ui';
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

const pct = (v) => (v === null || v === undefined ? '—' : `${(v * 100).toFixed(1)}%`);

function MetricsTable({ m }) {
  if (!m) return null;
  const rows = [
    ['Số mẫu', m.n],
    ['Tỉ lệ nhớ thực tế', pct(m.recall_rate)],
    ['Độ chính xác dự đoán (ngưỡng 50%)', `${pct(m.accuracy)} (đoán theo số đông: ${pct(m.majority_baseline_accuracy)})`],
    ['Điểm Brier (càng thấp càng tốt)', `${m.brier} (đoán theo tỉ lệ TB: ${m.constant_baseline_brier}; theo % đúng quá khứ: ${m.naive_brier})`],
    ['AUC (phân biệt nhớ/quên, 0.5 = ngẫu nhiên)', m.auc === null ? '—' : `${m.auc}${m.oracle_auc ? ` (tối đa lý thuyết ${m.oracle_auc})` : ''}`],
    ['Sai lệch hiệu chỉnh', pct(m.calibration_error)],
  ];
  return (
    <>
      <table className="table" style={{ marginBottom: 12 }}>
        <tbody>{rows.map(([k, v]) => <tr key={k}><td className="cell-sub">{k}</td><td className="cell-strong">{v}</td></tr>)}</tbody>
      </table>
      <p className="cell-sub" style={{ marginBottom: 4 }}>Hiệu chỉnh: dự đoán trung bình so với tỉ lệ nhớ thực tế theo từng khoảng</p>
      <table className="table">
        <thead><tr><th>Khoảng dự đoán</th><th>Số mẫu</th><th>Dự đoán TB</th><th>Thực tế</th></tr></thead>
        <tbody>{m.bins.map((b) => <tr key={b.range}><td>{b.range}</td><td>{b.n}</td><td>{pct(b.predicted)}</td><td>{pct(b.actual)}</td></tr>)}</tbody>
      </table>
    </>
  );
}

function MlTestPanel() {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      setResult(await systemService.testMl());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Bộ test độ chính xác ML" subtitle="Test hành vi, đối chiếu dự đoán với kết quả ôn tập thật và mô phỏng"
      action={result && <Badge tone={TONE[result.status]}>{LABEL[result.status]}</Badge>}
      footer={<Button variant="primary" onClick={run} disabled={busy}>{busy ? 'Đang chạy test...' : 'Chạy bộ test ML'}</Button>}>
      <ErrorBanner message={error} />
      {!result && !busy && <InfoNote>Bấm “Chạy bộ test ML” để chạy: (1) các bài test hành vi của mô hình, (2) đối chiếu dự đoán với các lượt ôn thật đã có trong hệ thống, (3) mô phỏng người học.</InfoNote>}
      {result && (
        <div className="stack" style={{ gap: 20 }}>
          <p className="cell-strong" style={{ whiteSpace: 'normal' }}>{result.summary}</p>
          <p className="cell-sub">Model: {result.model.loaded ? `đã nạp (${result.model.version})` : 'chưa nạp — đang dùng SM-2'}</p>

          <div>
            <p className="cell-strong" style={{ marginBottom: 8 }}>1. Test hành vi</p>
            <div className="stack" style={{ gap: 8 }}>
              {result.golden.map((t) => (
                <div key={t.key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Badge tone={t.pass ? 'ok' : 'err'}>{t.pass ? 'Đạt' : 'Không đạt'}</Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="cell-strong" style={{ whiteSpace: 'normal' }}>{t.name}</p>
                    <p className="cell-sub" style={{ whiteSpace: 'normal' }}>{t.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="cell-strong" style={{ marginBottom: 8 }}>2. Đối chiếu với lượt ôn thật</p>
            {result.real.insufficient
              ? <InfoNote>Mới có {result.real.n} lượt ôn thật đủ lịch sử (≥ 3 lượt trước đó cho cùng từ). Cần ít nhất 30 để đánh giá. Hãy để người dùng ôn tập thêm.</InfoNote>
              : <><p className="cell-sub" style={{ marginBottom: 8 }}>{result.real.verdict.message}</p><MetricsTable m={result.real} /></>}
          </div>

          <div>
            <p className="cell-strong" style={{ marginBottom: 8 }}>3. Mô phỏng người học (chỉ tham khảo)</p>
            <p className="cell-sub" style={{ marginBottom: 8 }}>{result.simulated.verdict.message}</p>
            <MetricsTable m={result.simulated} />
          </div>
        </div>
      )}
    </Panel>
  );
}


const AUDIENCES = [
  { value: 'students', label: 'Tất cả học viên đang hoạt động' },
  { value: 'all', label: 'Tất cả tài khoản đang hoạt động (gồm cả admin)' },
];

function BroadcastPanel() {
  const [form, setForm] = useState({ title: '', body: '', audience: 'students' });
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ready = form.title.trim() && form.body.trim();

  const send = async () => {
    setBusy(true); setMsg({ ok: '', err: '' });
    try {
      const r = await systemService.broadcastNotification({ title: form.title.trim(), body: form.body.trim(), audience: form.audience });
      setResult(r);
      setMsg({ ok: `Đã tạo ${r.inapp} thông báo trong app; push thành công ${r.push_sent}/${r.push_sent + r.push_failed}.`, err: '' });
      setForm((f) => ({ ...f, title: '', body: '' }));
    } catch (e) {
      setMsg({ ok: '', err: errorMessage(e) });
    } finally {
      setBusy(false); setConfirm(false);
    }
  };

  return (
    <Panel title="Gửi thông báo cho người dùng" subtitle="Gửi một thông báo tới tất cả người dùng: lưu trong app và đẩy push tới thiết bị đã đăng ký"
      footer={<Button variant="primary" disabled={!ready || busy} onClick={() => setConfirm(true)}>Gửi cho tất cả người dùng</Button>}>
      <ErrorBanner message={msg.err} />
      <SuccessBanner message={msg.ok} />
      {(msg.ok || msg.err) && <div style={{ height: 12 }} />}
      <div className="stack" style={{ gap: 16 }}>
        <TextField label="Tiêu đề" required maxLength={120} value={form.title} onChange={set('title')} placeholder="Ví dụ: Cập nhật mới từ EngUp" />
        <TextAreaField label="Nội dung" required rows={3} maxLength={500} value={form.body} onChange={set('body')} hint={`${form.body.length}/500 ký tự`} placeholder="Nội dung hiển thị trên màn hình khóa và trong mục Thông báo" />
        <SelectField label="Đối tượng nhận" options={AUDIENCES} value={form.audience} onChange={set('audience')} placeholder="Chọn đối tượng..." />
      </div>
      {result && (
        <p className="cell-sub" style={{ whiteSpace: 'normal', marginTop: 16 }}>
          Lần gửi gần nhất: {result.users} người nhận · push thành công {result.push_sent} · lỗi {result.push_failed} · chưa có token {result.no_token}{result.invalid_token ? ` · token sai định dạng ${result.invalid_token}` : ''}
          {result.errors?.length ? ` · lỗi từ Expo: ${result.errors.join('; ')}` : ''}
        </p>
      )}
      <ConfirmDialog open={confirm} title="Gửi thông báo cho tất cả?" confirmText="Gửi ngay" busy={busy} onConfirm={send} onCancel={() => setConfirm(false)}
        message={<><p className="cell-strong" style={{ whiteSpace: 'normal' }}>{form.title}</p><p className="cell-sub" style={{ whiteSpace: 'normal', marginTop: 4 }}>{form.body}</p><p className="field__hint" style={{ marginTop: 12 }}>Thông báo sẽ gửi tới: {AUDIENCES.find((a) => a.value === form.audience)?.label.toLowerCase()}. Không thể thu hồi sau khi gửi.</p></>} />
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
        <BroadcastPanel />
        <CheckPanel title="Mô hình ML (dự đoán trí nhớ)" subtitle="Kết nối, model đã nạp, dự đoán có hợp lý không, độ chính xác trên dữ liệu thật"
          fetcher={() => systemService.checkMl()}
          summary={() => <InfoNote>Độ chính xác thực tế chỉ có ý nghĩa khi có ≥ 30 lượt ôn đã được đối chiếu; lúc đó hệ thống so sánh xác suất ML dự đoán với việc người dùng có nhớ thật không.</InfoNote>} />
        <MlTestPanel />
      </div>
    </>
  );
}
