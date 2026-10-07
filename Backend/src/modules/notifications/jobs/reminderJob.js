const cron = require('node-cron');
const { Op } = require('sequelize');
const { UserVocabularyCard, SystemJobRun } = require('../../../common/models');
const notificationsRepository = require('../notifications.Repository');
const { notifyUser } = require('../notifications.sender');
const { APP_TIMEZONE, localTimeString } = require('../../../common/utils/appTime');

const state = { scheduled: false, lastTickAt: null, lastResult: null, lastError: null };

function bucketOf(hhmm) {
  if (!hhmm) return null;
  const [hh, mm] = String(hhmm).split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return `${String(hh).padStart(2, '0')}:${String(Math.floor(mm / 5) * 5).padStart(2, '0')}`;
}

function interpolate(template, vars) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => (vars[key] !== undefined ? vars[key] : ''));
}

async function buildMessage(type, vars) {
  const template = await notificationsRepository.findTemplateByType(type);
  if (template) {
    return {
      title: interpolate(template.title_template, vars),
      body: interpolate(template.body_template, vars)
    };
  }

  if (type === 'review_due') {
    return {
      title: 'Đến giờ ôn từ! 🔔',
      body: `Bạn có ${vars.count} từ cần ôn tập hôm nay.`
    };
  }
  return {
    title: 'Nhắc học từ vựng 📚',
    body: 'Đã đến giờ học từ mới hôm nay, vào ôn luyện ngay nhé!'
  };
}

async function runReminderJob({ now = new Date(), force = false, userId } = {}) {
  const nowBucket = bucketOf(localTimeString(now));
  const settingsList = await notificationsRepository.findSettingsForReminderJob();

  let dueSettings = settingsList.filter((s) => bucketOf(s.daily_reminder_time) === nowBucket);
  if (userId) dueSettings = settingsList.filter((s) => Number(s.user_id) === Number(userId));
  else if (force) dueSettings = settingsList;

  const stats = { bucket: nowBucket, candidates: settingsList.length, due: dueSettings.length, inapp: 0, push_sent: 0, push_failed: 0, no_token: 0, skipped_duplicate: 0 };
  const since = new Date(now.getTime() - 10 * 60 * 1000);

  for (const settings of dueSettings) {
    const dueCount = await UserVocabularyCard.count({
      where: {
        user_id: settings.user_id,
        next_review_at: { [Op.lte]: now }
      }
    });

    const type = dueCount > 0 ? 'review_due' : 'daily_reminder';
    if (!force && !userId && (await notificationsRepository.findRecentNotification(settings.user_id, type, since))) {
      stats.skipped_duplicate += 1;
      continue;
    }

    const { title, body } = await buildMessage(type, { count: dueCount });
    const { push } = await notifyUser({ user_id: settings.user_id, title, body, type });
    stats.inapp += 1;
    if (push.status === 'sent') stats.push_sent += 1;
    else if (push.status === 'failed') stats.push_failed += 1;
    else stats.no_token += 1;
  }

  return stats;
}

async function recordRun(trigger, status, summary, error, startedAt) {
  try {
    await SystemJobRun.create({
      job_name: 'reminder',
      trigger,
      status,
      summary,
      error_message: error || null,
      duration_ms: Date.now() - startedAt
    });
  } catch (err) {
    console.error('Không ghi được system_job_runs (reminder):', err.message);
  }
}

async function tick() {
  const startedAt = Date.now();
  state.lastTickAt = new Date();
  try {
    const stats = await runReminderJob();
    state.lastResult = stats;
    state.lastError = null;
    if (stats.due > 0) await recordRun('cron', stats.push_failed > 0 ? 'partial' : 'success', stats, null, startedAt);
  } catch (err) {
    state.lastError = err.message;
    console.error('❌ Lỗi khi chạy reminder job:', err.message);
    await recordRun('cron', 'failed', null, err.message, startedAt);
  }
}

function startReminderJob() {
  if (state.scheduled) return;
  cron.schedule('*/5 * * * *', tick, { timezone: APP_TIMEZONE });
  state.scheduled = true;
  console.log(`✅ Reminder job đã được lên lịch (mỗi 5 phút, múi giờ ${APP_TIMEZONE})`);
}

module.exports = { startReminderJob, runReminderJob, reminderState: state, bucketOf };
