// src/modules/streaks/streaks.job.js
// Đăng ký lịch chạy cron hàng ngày cho việc reset/đóng băng streak.
// Không có API riêng cho module streaks — đây là entry point duy nhất được server.js gọi.

const cron = require('node-cron');
const { runDailyStreakJob } = require('./streaks.service');

// Chạy lúc 00:10 mỗi ngày (giờ server) để tổng kết hoạt động của ngày hôm trước,
// đảm bảo dữ liệu review_logs/reading_attempts/listening_dictation_attempts của ngày đó đã đầy đủ.
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
