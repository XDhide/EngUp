// src/modules/streaks/streaks.service.js
// Không có API riêng cho module này — logic dưới đây được job/cron hàng ngày gọi để
// tự cập nhật bảng streaks của chính mình, dựa trên hoạt động đọc read-only từ các module khác.

const streaksRepository = require('./streaks.repository');

function toDateOnlyString(date) {
  return date.toISOString().slice(0, 10);
}

function addDaysToDateString(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateOnlyString(d);
}

// Cập nhật streak của 1 user cho "ngày mục tiêu" (targetDateStr), dựa trên việc
// ngày đó user có hoạt động hay không (wasActive).
async function processUserStreak(userId, targetDateStr, wasActive) {
  const streak = await streaksRepository.findStreakByUserId(userId);

  const currentStreak = streak ? streak.current_streak : 0;
  const longestStreak = streak ? streak.longest_streak : 0;
  const lastActiveDate = streak ? streak.last_active_date : null;
  const frozenUntil = streak ? streak.frozen_until : null;

  // Job đã xử lý ngày này rồi (ví dụ chạy trùng) -> bỏ qua để tránh cộng streak 2 lần
  if (lastActiveDate === targetDateStr) {
    return;
  }

  let nextCurrentStreak = currentStreak;
  let nextLastActiveDate = lastActiveDate;

  if (wasActive) {
    const expectedPreviousDate = addDaysToDateString(targetDateStr, -1);

    if (lastActiveDate === expectedPreviousDate) {
      // Hoạt động liên tục từ ngày hôm trước -> nối dài streak
      nextCurrentStreak = currentStreak + 1;
    } else {
      // Có khoảng trống trước đó (không được đóng băng) -> bắt đầu chuỗi mới từ 1
      nextCurrentStreak = 1;
    }
    nextLastActiveDate = targetDateStr;
  } else {
    // Không có hoạt động trong ngày mục tiêu -> kiểm tra có đang được đóng băng không
    // (frozen_until >= targetDateStr nghĩa là ngày này vẫn nằm trong thời gian được bảo lưu streak)
    const isFrozen = Boolean(frozenUntil) && frozenUntil >= targetDateStr;

    if (!isFrozen) {
      nextCurrentStreak = 0;
    } else {
      // Đang đóng băng: giữ nguyên current_streak, nhưng vẫn "nối" last_active_date sang
      // ngày này để nếu user hoạt động trở lại vào ngày kế tiếp, streak được tính liên tục
      // thay vì bị coi là có khoảng trống và phải bắt đầu lại từ 1.
      nextLastActiveDate = targetDateStr;
    }
  }

  const nextLongestStreak = Math.max(longestStreak, nextCurrentStreak);

  await streaksRepository.saveStreak(userId, {
    current_streak: nextCurrentStreak,
    longest_streak: nextLongestStreak,
    last_active_date: nextLastActiveDate
  });
}

// Job chạy hàng ngày (nên chạy sau nửa đêm) để tổng kết hoạt động của "hôm qua"
// theo giờ server, vì dữ liệu của ngày hôm qua lúc đó đã đầy đủ.
async function runDailyStreakJob(referenceDate = new Date()) {
  const targetDateStr = addDaysToDateString(toDateOnlyString(referenceDate), -1);

  const [allUserIds, activeUserIds] = await Promise.all([
    streaksRepository.findAllActiveUserIds(),
    streaksRepository.findActiveUserIdsOnDate(targetDateStr)
  ]);

  const results = await Promise.allSettled(
    allUserIds.map((userId) => processUserStreak(userId, targetDateStr, activeUserIds.has(userId)))
  );

  const failedResults = results.filter((r) => r.status === 'rejected');
  if (failedResults.length > 0) {
    console.error(`⚠️ Streak job: ${failedResults.length}/${allUserIds.length} user cập nhật streak thất bại`);
    failedResults.forEach((r) => console.error(r.reason));
  }

  console.log(
    `✅ Streak job hoàn tất cho ngày ${targetDateStr}: ${activeUserIds.size}/${allUserIds.length} user có hoạt động`
  );

  return {
    date: targetDateStr,
    total_users: allUserIds.length,
    active_users: activeUserIds.size,
    failed_users: failedResults.length
  };
}

module.exports = {
  runDailyStreakJob,
  processUserStreak,
  toDateOnlyString,
  addDaysToDateString
};
