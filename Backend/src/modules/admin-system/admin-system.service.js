const { Op, fn, col } = require('sequelize');
const {
  sequelize, Streak, User, Notification, NotificationSetting, NotificationTemplate,
  MlPredictionLog, SystemJobRun, UserVocabularyCard, ReviewLog, VocabularyWord, AuditLog
} = require('../../common/models');
const AppError = require('../../common/utils/AppError');
const streaks = require('../streaks/streaks.service');
const { jobState: streakJobState } = require('../streaks/streaks.job');
const { reminderState, runReminderJob } = require('../notifications/jobs/reminderJob');
const { notifyUser } = require('../notifications/notifications.sender');
const { APP_TIMEZONE, localDateString, localDayRangeUtc, addDaysToDateString, localTimeString } = require('../../common/utils/appTime');

const OK = 'ok', WARN = 'warn', FAIL = 'fail', INFO = 'info';
const check = (key, label, status, message, extra) => ({ key, label, status, message, ...(extra ? { data: extra } : {}) });
const worst = (checks) => (checks.some((c) => c.status === FAIL) ? FAIL : checks.some((c) => c.status === WARN) ? WARN : OK);

function assertAdmin(r) {
  if (!r || r.role !== 'admin') throw new AppError('Chỉ admin mới có quyền thao tác này', 403);
}

const ago = (d) => {
  if (!d) return null;
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (mins < 2880) return `${Math.round(mins / 60)} giờ trước`;
  return `${Math.round(mins / 1440)} ngày trước`;
};

async function lastRun(jobName, where = {}) {
  return SystemJobRun.findOne({ where: { job_name: jobName, ...where }, order: [['created_at', 'DESC']], raw: true });
}

async function checkStreak(requester) {
  assertAdmin(requester);
  const checks = [];
  const today = localDateString();
  const yesterday = addDaysToDateString(today, -1);

  const tests = streaks.selfTest();
  const failedTests = tests.filter((t) => !t.ok);
  checks.push(check('logic', 'Logic tính chuỗi ngày học', failedTests.length ? FAIL : OK,
    failedTests.length ? `${failedTests.length}/${tests.length} kịch bản cho kết quả sai` : `Đạt ${tests.length}/${tests.length} kịch bản (học liên tiếp, bỏ lỡ ngày, đóng băng, chạy lại job...)`, tests));

  checks.push(check('scheduled', 'Job chốt streak đã lên lịch', streakJobState.scheduled ? OK : FAIL,
    streakJobState.scheduled ? `Chạy lúc 00:10 mỗi ngày (múi giờ ${APP_TIMEZONE}); nhắc giữ chuỗi lúc 20:00` : 'Job chưa được lên lịch — chuỗi sẽ không bao giờ được chốt/reset'));

  const run = await lastRun('streak');
  if (!run) checks.push(check('last_run', 'Lần chạy job gần nhất', WARN, 'Chưa có lần chạy nào được ghi nhận (job chạy lúc 00:10 hoặc bấm "Chạy ngay" bên dưới)'));
  else {
    const stale = Date.now() - new Date(run.created_at).getTime() > 36 * 3600 * 1000;
    const st = run.status === 'failed' ? FAIL : (stale || run.status === 'partial') ? WARN : OK;
    checks.push(check('last_run', 'Lần chạy job gần nhất', st,
      `${ago(run.created_at)} (${run.trigger === 'manual' ? 'chạy tay' : 'tự động'}) cho ngày ${run.target_date || '?'} — ${run.status}${run.error_message ? `: ${run.error_message}` : ''}${stale ? '. Đã quá 36 giờ chưa chạy lại' : ''}`, run.summary));
  }

  const [total, active, stale, broken] = await Promise.all([
    User.count({ where: { is_active: true, role: 'student' } }),
    Streak.count({ where: { current_streak: { [Op.gt]: 0 } } }),
    Streak.count({ where: { current_streak: { [Op.gt]: 0 }, last_active_date: { [Op.lt]: yesterday }, [Op.or]: [{ frozen_until: null }, { frozen_until: { [Op.lt]: yesterday } }] } }),
    Streak.count({ where: sequelize.where(sequelize.col('longest_streak'), Op.lt, sequelize.col('current_streak')) })
  ]);
  checks.push(check('stale', 'Chuỗi quá hạn chưa được reset', stale ? FAIL : OK,
    stale ? `${stale} người có chuỗi > 0 nhưng đã bỏ học từ trước hôm qua — job hằng ngày không chạy hoặc lỗi` : 'Không có chuỗi nào bị "treo"'));
  checks.push(check('consistency', 'Kỷ lục ≥ chuỗi hiện tại', broken ? FAIL : OK, broken ? `${broken} bản ghi có longest_streak < current_streak` : 'Dữ liệu nhất quán'));

  const { start, end } = localDayRangeUtc(yesterday);
  const activeYesterday = [...(await require('../streaks/streaks.repository').findActiveUserIdsInRange(start, end))];
  let missed = 0;
  if (activeYesterday.length) {
    const rows = await Streak.findAll({ where: { user_id: activeYesterday, last_active_date: { [Op.gte]: yesterday } }, attributes: ['user_id'], raw: true });
    missed = activeYesterday.length - rows.length;
  }
  checks.push(check('recorded', 'Hoạt động hôm qua đã vào streak', missed ? FAIL : OK,
    missed ? `${missed}/${activeYesterday.length} người đã học hôm qua nhưng streak chưa ghi nhận — hãy bấm "Chạy lại cho hôm qua"` : `${activeYesterday.length} người học hôm qua đều đã được ghi nhận`));

  checks.push(check('notify', 'Thông báo liên quan streak', INFO,
    'Hệ thống gửi: "mất chuỗi" (sau job 00:10) và "sắp mất chuỗi" (20:00). Cần người dùng đặt nhắc học ở màn Thông báo thì mới nhận push; thông báo trong app luôn được lưu.', streakJobState.lastRiskResult));

  const top = await Streak.findAll({ order: [['current_streak', 'DESC']], limit: 5, include: [{ model: User, as: 'user', attributes: ['full_name', 'email'] }] });
  return {
    status: worst(checks), generated_at: new Date(), timezone: APP_TIMEZONE, today,
    stats: { students: total, with_streak: active, longest_current: top[0] ? top[0].current_streak : 0 },
    top: top.map((s) => ({ user: s.user ? (s.user.full_name || s.user.email) : `#${s.user_id}`, current: s.current_streak, longest: s.longest_streak, last_active_date: s.last_active_date })),
    checks
  };
}

async function runStreakNow(requester, { date } = {}) {
  assertAdmin(requester);
  if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new AppError('date phải có dạng YYYY-MM-DD', 400);
  if (date && date >= localDateString()) throw new AppError('Chỉ chốt được các ngày đã kết thúc (trước hôm nay)', 400);
  const result = await streaks.runDailyStreakJob(new Date(), { trigger: 'manual', targetDate: date });
  await AuditLog.create({ actor_id: requester.id, action: 'streak.run_manual', target_type: 'system', target_id: 0, detail: result }).catch(() => {});
  return result;
}

async function checkNotifications(requester) {
  assertAdmin(requester);
  const checks = [];
  const now = new Date();
  const day = new Date(now.getTime() - 24 * 3600 * 1000);
  const week = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  checks.push(check('scheduled', 'Job nhắc học đã lên lịch', reminderState.scheduled ? OK : FAIL,
    reminderState.scheduled ? `Chạy mỗi 5 phút (múi giờ ${APP_TIMEZONE}); lần quét gần nhất: ${ago(reminderState.lastTickAt) || 'chưa có'}` : 'Job chưa chạy — người dùng sẽ KHÔNG nhận được nhắc học nào'));
  if (reminderState.lastError) checks.push(check('tick_error', 'Lần quét gần nhất', FAIL, reminderState.lastError));

  const [users, settings, withTime, withToken, enabled] = await Promise.all([
    User.count({ where: { is_active: true, role: 'student' } }),
    NotificationSetting.count(),
    NotificationSetting.count({ where: { daily_reminder_time: { [Op.ne]: null } } }),
    NotificationSetting.count({ where: { push_token: { [Op.ne]: null } } }),
    NotificationSetting.count({ where: { review_reminder_enabled: true, daily_reminder_time: { [Op.ne]: null } } })
  ]);
  checks.push(check('audience', 'Người dùng có thể nhận nhắc học', enabled ? OK : WARN,
    `${enabled}/${users} học viên đã bật & đặt giờ nhắc; ${withToken} người đã đăng ký push token (cần mở app trên điện thoại thật bằng Expo Go/bản build và cho phép thông báo)`, { users, settings, with_time: withTime, with_token: withToken, enabled }));
  if (!withToken) checks.push(check('token', 'Push token', WARN, 'Chưa có thiết bị nào đăng ký push token: chỉ có thông báo trong app, chưa có push ra màn hình khóa'));

  const [sent24, sent7, unread, byType] = await Promise.all([
    Notification.count({ where: { created_at: { [Op.gte]: day } } }),
    Notification.count({ where: { created_at: { [Op.gte]: week } } }),
    Notification.count({ where: { is_read: false } }),
    Notification.findAll({ attributes: ['type', [fn('COUNT', col('id')), 'count']], where: { created_at: { [Op.gte]: week } }, group: ['type'], raw: true })
  ]);
  checks.push(check('volume', 'Thông báo đã tạo', sent7 ? OK : (enabled ? WARN : INFO),
    `${sent24} trong 24 giờ, ${sent7} trong 7 ngày, ${unread} chưa đọc`, byType));

  const templates = await NotificationTemplate.findAll({ attributes: ['type'], raw: true });
  const types = new Set(templates.map((t) => t.type));
  const missing = ['review_due', 'daily_reminder'].filter((t) => !types.has(t));
  checks.push(check('templates', 'Mẫu thông báo', missing.length ? INFO : OK,
    missing.length ? `Chưa có mẫu cho: ${missing.join(', ')} → dùng nội dung mặc định trong code (vẫn hoạt động)` : 'Đủ mẫu review_due và daily_reminder'));

  const run = await lastRun('reminder');
  checks.push(check('last_run', 'Lần gửi gần nhất', run ? (run.status === 'failed' ? FAIL : run.status === 'partial' ? WARN : OK) : INFO,
    run ? `${ago(run.created_at)} — ${run.status}${run.error_message ? `: ${run.error_message}` : ''}` : 'Chưa có lượt gửi nào được ghi nhận', run ? run.summary : null));

  let expo;
  try {
    const r = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ to: 'ExponentPushToken[invalid-check]', title: 't', body: 'b' }), signal: AbortSignal.timeout(8000) });
    expo = check('expo', 'Kết nối dịch vụ Expo Push', r.status < 500 ? OK : WARN, r.status < 500 ? 'Máy chủ có thể gọi tới Expo Push API' : `Expo trả HTTP ${r.status}`);
  } catch (err) {
    expo = check('expo', 'Kết nối dịch vụ Expo Push', FAIL, `Máy chủ không gọi được Expo: ${err.message}. Kiểm tra mạng/tường lửa của Backend`);
  }
  checks.push(expo);

  return { status: worst(checks), generated_at: now, timezone: APP_TIMEZONE, local_time: localTimeString(), checks };
}

async function sendTestNotification(requester, { user_id } = {}) {
  assertAdmin(requester);
  const target = user_id ? await User.findByPk(user_id) : await User.findByPk(requester.id);
  if (!target) throw new AppError('Người dùng không tồn tại', 404);
  const { notification, push } = await notifyUser({
    user_id: target.id, type: 'system', respectSettings: false,
    title: 'Thông báo thử từ EngUp 🔔', body: 'Nếu bạn thấy thông báo này, hệ thống thông báo đang hoạt động.'
  });
  return {
    user_id: target.id, user_name: target.full_name || target.email, notification_id: notification.id,
    in_app: 'created', push: push.status, push_error: push.error || null,
    hint: push.status === 'no_token' ? 'Người dùng này chưa có Expo push token (chưa mở màn Thông báo trên điện thoại thật và cấp quyền), nên chỉ có thông báo trong app.' : null
  };
}

async function runReminderNow(requester, { user_id } = {}) {
  assertAdmin(requester);
  return runReminderJob({ userId: user_id });
}

const ML_URL = () => (process.env.ML_SERVICE_URL || '').replace(/\/+$/, '');
const ML_KEY = () => process.env.ML_INTERNAL_KEY || process.env.INTERNAL_API_KEY || '';

async function mlFetch(path, { method = 'GET', body, key = false, timeout = 8000 } = {}) {
  const t0 = Date.now();
  const res = await fetch(`${ML_URL()}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(key && ML_KEY() ? { 'X-Internal-Key': ML_KEY() } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout)
  });
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, json, ms: Date.now() - t0 };
}

const hist = (results, gapHours = 24) => results.map((r, i) => ({
  result: r, response_time_ms: 1800,
  reviewed_at: new Date(Date.now() - (results.length - i) * gapHours * 3600 * 1000).toISOString()
}));

async function checkMl(requester) {
  assertAdmin(requester);
  const checks = [];
  if (!ML_URL()) {
    checks.push(check('config', 'Cấu hình ML_SERVICE_URL', FAIL, 'Backend chưa có ML_SERVICE_URL trong .env → flashcard luôn dùng SM-2 thuần, không có dự đoán xác suất nhớ'));
    return { status: FAIL, generated_at: new Date(), checks };
  }
  checks.push(check('config', 'Cấu hình ML_SERVICE_URL', OK, ML_URL()));

  let health;
  try {
    health = await mlFetch('/health', { timeout: 5000 });
    checks.push(check('health', 'ML server phản hồi', health.ok ? OK : FAIL, health.ok ? `Phản hồi trong ${health.ms} ms` : `HTTP ${health.status}`));
  } catch (err) {
    checks.push(check('health', 'ML server phản hồi', FAIL, `Không kết nối được: ${err.message}. Hãy chạy MLSever (uvicorn) hoặc kiểm tra ML_SERVICE_URL`));
    return { status: FAIL, generated_at: new Date(), checks };
  }
  const loaded = health.json && health.json.model_loaded;
  if (loaded === false) checks.push(check('model', 'Model đã nạp', WARN, 'Chưa nạp được recall_model.joblib → ML đang dùng SM-2 dự phòng (vẫn chạy nhưng chưa dùng AI)'));
  else if (loaded === true) checks.push(check('model', 'Model đã nạp', OK, `Phiên bản ${health.json.model_version}`));

  const probe = async (history) => (await mlFetch('/predict', { method: 'POST', body: { user_id: requester.id, word_id: 1, review_history: history, dry_run: true } })).json?.data;
  try {
    const strong = await probe(hist(['good', 'easy', 'good', 'easy', 'good', 'easy'], 48));
    const weak = await probe(hist(['again', 'again', 'hard', 'again', 'again', 'hard'], 6));
    const cold = await probe(hist(['good'], 24));
    const valid = (p) => p && typeof p.recall_probability === 'number' && p.recall_probability >= 0 && p.recall_probability <= 1 && !Number.isNaN(Date.parse(p.next_review_at));
    checks.push(check('shape', 'Định dạng dự đoán hợp lệ', valid(strong) && valid(weak) && valid(cold) ? OK : FAIL,
      valid(strong) && valid(weak) && valid(cold) ? 'Xác suất ∈ [0,1], có next_review_at' : 'Kết quả /predict thiếu hoặc sai định dạng', { strong, weak, cold }));
    if (valid(strong) && valid(weak)) {
      const dir = strong.recall_probability >= weak.recall_probability;
      checks.push(check('sanity', 'Hợp lý: học tốt ⇒ nhớ cao hơn học kém', dir ? OK : FAIL,
        `Lịch sử tốt: ${(strong.recall_probability * 100).toFixed(1)}% — lịch sử kém: ${(weak.recall_probability * 100).toFixed(1)}%${dir ? '' : ' (ngược! model có vấn đề)'}`));
      const later = Date.parse(strong.next_review_at) >= Date.parse(weak.next_review_at);
      checks.push(check('schedule', 'Hợp lý: học tốt ⇒ lịch ôn xa hơn', later ? OK : WARN, later ? 'Khoảng cách ôn tăng theo độ thuộc' : 'Lịch ôn của lịch sử tốt lại gần hơn lịch sử kém'));
    }
    if (valid(cold)) checks.push(check('fallback', 'Ít dữ liệu ⇒ dùng SM-2', cold.used_fallback_sm2 ? OK : INFO, cold.used_fallback_sm2 ? 'Từ mới (ít lần ôn) dùng SM-2 đúng thiết kế' : 'Từ chỉ 1 lần ôn vẫn dùng ML'));
  } catch (err) {
    checks.push(check('shape', 'Gọi /predict', FAIL, `Lỗi: ${err.message}`));
  }

  try {
    const acc = await mlFetch('/metrics/accuracy?days=30&refresh=true', { key: true, timeout: 20000 });
    if (acc.status === 401) checks.push(check('accuracy', 'Độ chính xác thực tế (30 ngày)', WARN, 'ML yêu cầu khóa nội bộ: đặt ML_INTERNAL_KEY trong Backend/.env trùng INTERNAL_API_KEY của MLSever'));
    else if (!acc.ok) checks.push(check('accuracy', 'Độ chính xác thực tế (30 ngày)', WARN, `Không lấy được số liệu (HTTP ${acc.status})`));
    else {
      const d = acc.json.data || acc.json; const m = d.ml_model || {}; const s = d.sm2_fallback || {};
      if (!m.n) checks.push(check('accuracy', 'Độ chính xác thực tế (30 ngày)', INFO, `Chưa có dự đoán ML nào được đối chiếu với kết quả thật (SM-2: ${s.n || 0} mẫu). Cần người dùng ôn thêm.`, d));
      else {
        const lowN = m.n < 30;
        const poor = m['accuracy_at_0.5'] < 0.6 || Math.abs(m.calibration_gap) > 0.2;
        checks.push(check('accuracy', 'Độ chính xác thực tế (30 ngày)', lowN ? INFO : poor ? WARN : OK,
          `ML: đúng ${(m['accuracy_at_0.5'] * 100).toFixed(1)}% trên ${m.n} mẫu, Brier ${m.brier}, lệch hiệu chỉnh ${m.calibration_gap > 0 ? '+' : ''}${m.calibration_gap}` +
          (lowN ? ' — mẫu còn ít (<30) nên chỉ mang tính tham khảo' : poor ? ' — chưa tốt, cân nhắc huấn luyện lại model' : '') +
          (s.n ? ` | SM-2: đúng ${(s['accuracy_at_0.5'] * 100).toFixed(1)}% (${s.n} mẫu)` : ''), d));
      }
    }
  } catch (err) {
    checks.push(check('accuracy', 'Độ chính xác thực tế (30 ngày)', WARN, `Không lấy được: ${err.message}`));
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [logs24, mlLogs24] = await Promise.all([
    MlPredictionLog.count({ where: { predicted_at: { [Op.gte]: since } } }),
    MlPredictionLog.count({ where: { predicted_at: { [Op.gte]: since }, used_fallback_sm2: false } })
  ]);
  checks.push(check('usage', 'ML được Backend gọi khi ôn tập', logs24 ? OK : INFO,
    logs24 ? `24 giờ qua: ${logs24} dự đoán (${mlLogs24} bằng ML, ${logs24 - mlLogs24} bằng SM-2)` : 'Chưa có dự đoán nào trong 24 giờ qua (chưa ai mở màn ôn tập hoặc Backend không gọi được ML)'));
  checks.push(check('scheduling_note', 'Lịch ôn tiếp theo', INFO, 'Hiện ML chỉ dùng để hiển thị xác suất nhớ; lịch ôn thật sự khi chấm thẻ vẫn tính bằng SM-2 trong Backend.'));

  return { status: worst(checks), generated_at: new Date(), checks };
}

async function overview(requester) {
  assertAdmin(requester);
  const [s, n, m] = await Promise.allSettled([checkStreak(requester), checkNotifications(requester), checkMl(requester)]);
  const pick = (r) => (r.status === 'fulfilled' ? { status: r.value.status, problems: r.value.checks.filter((c) => c.status === FAIL || c.status === WARN).length } : { status: FAIL, problems: 1, error: r.reason?.message });
  return { streak: pick(s), notifications: pick(n), ml: pick(m) };
}

module.exports = { checkStreak, runStreakNow, checkNotifications, sendTestNotification, runReminderNow, checkMl, overview };
