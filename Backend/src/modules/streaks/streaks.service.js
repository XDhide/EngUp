const streaksRepository = require('./streaks.repository');
const { SystemJobRun } = require('../../common/models');
const { notifyUser } = require('../notifications/notifications.sender');
const {
  localDateString,
  addDaysToDateString,
  localDayRangeUtc
} = require('../../common/utils/appTime');

function toDateOnlyString(date) {
  return date.toISOString().slice(0, 10);
}

function computeStreakTransition(state, targetDateStr, wasActive) {
  const currentStreak = Number(state.current_streak || 0);
  const longestStreak = Number(state.longest_streak || 0);
  const lastActiveDate = state.last_active_date || null;
  const frozenUntil = state.frozen_until || null;

  const unchanged = {
    changed: false,
    lost: false,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_active_date: lastActiveDate
  };

  if (lastActiveDate && lastActiveDate >= targetDateStr) return unchanged;

  let nextCurrent = currentStreak;
  let nextLast = lastActiveDate;

  if (wasActive) {
    nextCurrent = lastActiveDate === addDaysToDateString(targetDateStr, -1) ? currentStreak + 1 : 1;
    nextLast = targetDateStr;
  } else {
    const isFrozen = Boolean(frozenUntil) && frozenUntil >= targetDateStr;
    if (!isFrozen) nextCurrent = 0;
    else nextLast = targetDateStr;
  }

  return {
    changed: true,
    lost: currentStreak > 0 && nextCurrent === 0,
    current_streak: nextCurrent,
    longest_streak: Math.max(longestStreak, nextCurrent),
    last_active_date: nextLast
  };
}

async function processUserStreak(userId, targetDateStr, wasActive) {
  const streak = await streaksRepository.findStreakByUserId(userId);
  const result = computeStreakTransition(streak || {}, targetDateStr, wasActive);
  if (!result.changed) return result;

  await streaksRepository.saveStreak(userId, {
    current_streak: result.current_streak,
    longest_streak: result.longest_streak,
    last_active_date: result.last_active_date
  });
  return result;
}

async function recordActivity(userId, now = new Date()) {
  const today = localDateString(now);
  const streak = await streaksRepository.findStreakByUserId(userId);
  const result = computeStreakTransition(streak || {}, today, true);
  if (!result.changed) return result;
  await streaksRepository.saveStreak(userId, {
    current_streak: result.current_streak,
    longest_streak: result.longest_streak,
    last_active_date: result.last_active_date
  });
  return result;
}

function touchActivity(userId) {
  return recordActivity(userId).catch((err) => {
    console.error(`⚠️ Không cập nhật được streak cho user ${userId}:`, err.message);
    return null;
  });
}

async function recordJobRun({ trigger, status, targetDate, summary, error, startedAt }) {
  try {
    await SystemJobRun.create({
      job_name: 'streak',
      trigger,
      status,
      target_date: targetDate || null,
      summary: summary || null,
      error_message: error || null,
      duration_ms: Date.now() - startedAt
    });
  } catch (err) {
    console.error('Không ghi được system_job_runs (streak):', err.message);
  }
}

async function runDailyStreakJob(referenceDate = new Date(), { trigger = 'cron', targetDate } = {}) {
  const startedAt = Date.now();
  const targetDateStr = targetDate || addDaysToDateString(localDateString(referenceDate), -1);

  try {
    const { start, end } = localDayRangeUtc(targetDateStr);
    const [allUserIds, activeUserIds] = await Promise.all([
      streaksRepository.findAllActiveUserIds(),
      streaksRepository.findActiveUserIdsInRange(start, end)
    ]);

    const results = await Promise.allSettled(
      allUserIds.map((userId) => processUserStreak(userId, targetDateStr, activeUserIds.has(userId)))
    );

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      console.error(`⚠️ Streak job: ${failed.length}/${allUserIds.length} user cập nhật streak thất bại`);
      failed.forEach((r) => console.error(r.reason));
    }

    const lostUserIds = [];
    results.forEach((r, i) => { if (r.status === 'fulfilled' && r.value.lost) lostUserIds.push(allUserIds[i]); });
    let notified = 0;
    for (const userId of lostUserIds) {
      try {
        await notifyUser({
          user_id: userId,
          type: 'streak_lost',
          title: 'Chuỗi ngày học đã bị gián đoạn 😢',
          body: 'Hôm qua bạn chưa học nên chuỗi đã về 0. Học vài phút hôm nay để bắt đầu chuỗi mới nhé!'
        });
        notified += 1;
      } catch (err) {
        console.error(`⚠️ Không gửi được thông báo mất chuỗi cho user ${userId}:`, err.message);
      }
    }

    console.log(`✅ Streak job hoàn tất cho ngày ${targetDateStr}: ${activeUserIds.size}/${allUserIds.length} user có hoạt động`);

    const summary = {
      date: targetDateStr,
      total_users: allUserIds.length,
      active_users: activeUserIds.size,
      failed_users: failed.length,
      lost_streaks: lostUserIds.length,
      notified_lost: notified
    };
    await recordJobRun({
      trigger, targetDate: targetDateStr, summary, startedAt,
      status: failed.length ? 'partial' : 'success',
      error: failed.length ? `${failed.length} user lỗi` : null
    });
    return summary;
  } catch (err) {
    await recordJobRun({ trigger, targetDate: targetDateStr, status: 'failed', error: err.message, startedAt });
    throw err;
  }
}

async function runStreakRiskReminder(now = new Date()) {
  const today = localDateString(now);
  const { Streak, NotificationSetting } = require('../../common/models');
  const { Op } = require('sequelize');
  const streaks = await Streak.findAll({
    where: { current_streak: { [Op.gt]: 0 }, [Op.or]: [{ last_active_date: null }, { last_active_date: { [Op.lt]: today } }] },
    raw: true
  });
  let sent = 0;
  for (const s of streaks) {
    if (s.frozen_until && s.frozen_until >= today) continue;
    const setting = await NotificationSetting.findOne({ where: { user_id: s.user_id }, raw: true });
    if (setting && setting.review_reminder_enabled === 0) continue;
    try {
      await notifyUser({
        user_id: s.user_id,
        type: 'streak_risk',
        title: `Giữ chuỗi ${s.current_streak} ngày nhé! 🔥`,
        body: 'Hôm nay bạn chưa học. Dành vài phút ôn từ trước nửa đêm để không mất chuỗi.'
      });
      sent += 1;
    } catch (err) {
      console.error(`⚠️ Không gửi được nhắc giữ chuỗi cho user ${s.user_id}:`, err.message);
    }
  }
  return { date: today, at_risk: streaks.length, sent };
}

function selfTest() {
  const T = '2026-01-10';
  const cases = [
    { name: 'Người mới học lần đầu -> chuỗi = 1', state: {}, active: true, expect: { current_streak: 1, last_active_date: T } },
    { name: 'Học liên tiếp (hôm kia có học) -> chuỗi +1', state: { current_streak: 4, longest_streak: 4, last_active_date: '2026-01-09' }, active: true, expect: { current_streak: 5, longest_streak: 5 } },
    { name: 'Bỏ lỡ 1 ngày rồi học lại -> chuỗi về 1', state: { current_streak: 6, longest_streak: 6, last_active_date: '2026-01-07' }, active: true, expect: { current_streak: 1, longest_streak: 6 } },
    { name: 'Không học -> chuỗi về 0, giữ kỷ lục', state: { current_streak: 3, longest_streak: 9, last_active_date: '2026-01-09' }, active: false, expect: { current_streak: 0, longest_streak: 9, lost: true } },
    { name: 'Đóng băng còn hiệu lực -> không mất chuỗi', state: { current_streak: 3, longest_streak: 3, last_active_date: '2026-01-09', frozen_until: '2026-01-12' }, active: false, expect: { current_streak: 3, lost: false } },
    { name: 'Chạy lại job cho ngày đã xử lý -> không đổi (idempotent)', state: { current_streak: 2, longest_streak: 2, last_active_date: T }, active: false, expect: { current_streak: 2, changed: false } },
    { name: 'Đã cập nhật tức thì hôm nay rồi job chốt ngày hôm qua -> không ghi đè', state: { current_streak: 5, longest_streak: 5, last_active_date: '2026-01-11' }, active: true, expect: { current_streak: 5, last_active_date: '2026-01-11', changed: false } },
    { name: 'Chuỗi 0 không học tiếp -> không bị coi là vừa mất chuỗi', state: { current_streak: 0, longest_streak: 2, last_active_date: '2026-01-05' }, active: false, expect: { current_streak: 0, lost: false } }
  ];
  return cases.map((c) => {
    const actual = computeStreakTransition(c.state, T, c.active);
    const ok = Object.entries(c.expect).every(([k, v]) => actual[k] === v);
    return { name: c.name, ok, expected: c.expect, actual: { current_streak: actual.current_streak, longest_streak: actual.longest_streak, last_active_date: actual.last_active_date, lost: actual.lost, changed: actual.changed } };
  });
}

module.exports = {
  runDailyStreakJob,
  runStreakRiskReminder,
  processUserStreak,
  computeStreakTransition,
  recordActivity,
  touchActivity,
  selfTest,
  toDateOnlyString,
  addDaysToDateString
};
