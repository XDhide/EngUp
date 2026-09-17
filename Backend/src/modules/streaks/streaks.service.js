const streaksRepository = require('./streaks.repository');

function toDateOnlyString(date) {
  return date.toISOString().slice(0, 10);
}

function addDaysToDateString(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateOnlyString(d);
}

async function processUserStreak(userId, targetDateStr, wasActive) {
  const streak = await streaksRepository.findStreakByUserId(userId);

  const currentStreak = streak ? streak.current_streak : 0;
  const longestStreak = streak ? streak.longest_streak : 0;
  const lastActiveDate = streak ? streak.last_active_date : null;
  const frozenUntil = streak ? streak.frozen_until : null;

  if (lastActiveDate === targetDateStr) {
    return;
  }

  let nextCurrentStreak = currentStreak;
  let nextLastActiveDate = lastActiveDate;

  if (wasActive) {
    const expectedPreviousDate = addDaysToDateString(targetDateStr, -1);

    if (lastActiveDate === expectedPreviousDate) {

      nextCurrentStreak = currentStreak + 1;
    } else {

      nextCurrentStreak = 1;
    }
    nextLastActiveDate = targetDateStr;
  } else {

    const isFrozen = Boolean(frozenUntil) && frozenUntil >= targetDateStr;

    if (!isFrozen) {
      nextCurrentStreak = 0;
    } else {

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
