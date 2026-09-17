const cron = require('node-cron');
const { runDailyStreakJob } = require('./streaks.service');

const STREAK_JOB_CRON_EXPRESSION = '10 0 * * *';

function scheduleStreakJob() {
  cron.schedule(STREAK_JOB_CRON_EXPRESSION, async () => {
    try {
      await runDailyStreakJob();
    } catch (err) {
      console.error('❌ Lỗi khi chạy streak job:', err);
    }
  });

  console.log(`🕐 Đã lên lịch streak job hàng ngày (cron: "${STREAK_JOB_CRON_EXPRESSION}")`);
}

module.exports = { scheduleStreakJob };
