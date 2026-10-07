const cron = require('node-cron');
const { runDailyStreakJob, runStreakRiskReminder } = require('./streaks.service');
const { APP_TIMEZONE } = require('../../common/utils/appTime');

const STREAK_JOB_CRON_EXPRESSION = '10 0 * * *';
const STREAK_RISK_CRON_EXPRESSION = '0 20 * * *';

const jobState = { scheduled: false, timezone: APP_TIMEZONE, cron: STREAK_JOB_CRON_EXPRESSION, riskCron: STREAK_RISK_CRON_EXPRESSION, lastRiskResult: null };

function scheduleStreakJob() {
  if (jobState.scheduled) return;

  cron.schedule(STREAK_JOB_CRON_EXPRESSION, async () => {
    try {
      await runDailyStreakJob();
    } catch (err) {
      console.error('❌ Lỗi khi chạy streak job:', err);
    }
  }, { timezone: APP_TIMEZONE });

  cron.schedule(STREAK_RISK_CRON_EXPRESSION, async () => {
    try {
      jobState.lastRiskResult = await runStreakRiskReminder();
    } catch (err) {
      console.error('❌ Lỗi khi chạy nhắc giữ chuỗi:', err);
    }
  }, { timezone: APP_TIMEZONE });

  jobState.scheduled = true;
  console.log(`Đã lên lịch streak job hàng ngày (cron: "${STREAK_JOB_CRON_EXPRESSION}", múi giờ ${APP_TIMEZONE}) và nhắc giữ chuỗi lúc 20:00`);
}

module.exports = { scheduleStreakJob, jobState, STREAK_JOB_CRON_EXPRESSION };
