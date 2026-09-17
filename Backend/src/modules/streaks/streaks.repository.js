// src/modules/streaks/streaks.repository.js
// Lớp DUY NHẤT trong module streaks được phép truy vấn trực tiếp Sequelize model.
// - Bảng `streaks`: module này sở hữu, được phép insert/update trực tiếp.
// - Bảng review_logs / reading_attempts / listening_dictation_attempts: chỉ đọc read-only
//   để xác định user có hoạt động học tập trong ngày hay không, KHÔNG được sửa dữ liệu ở đây.

const { fn, col, where: sqlWhere } = require('sequelize');
const {
  Streak,
  User,
  ReviewLog,
  ReadingAttempt,
  ListeningDictationAttempt
} = require('../../common/models');

async function findAllActiveUserIds() {
  const users = await User.findAll({
    attributes: ['id'],
    where: { is_active: true },
    raw: true
  });
  return users.map((u) => Number(u.id));
}

function dateEqualsClause(columnName, dateStr) {
  return sqlWhere(fn('DATE', col(columnName)), dateStr);
}

async function findDistinctUserIdsWithReviewOn(dateStr) {
  const rows = await ReviewLog.findAll({
    attributes: [[fn('DISTINCT', col('user_id')), 'user_id']],
    where: dateEqualsClause('reviewed_at', dateStr),
    raw: true
  });
  return rows.map((r) => Number(r.user_id));
}

async function findDistinctUserIdsWithReadingOn(dateStr) {
  const rows = await ReadingAttempt.findAll({
    attributes: [[fn('DISTINCT', col('user_id')), 'user_id']],
    where: dateEqualsClause('submitted_at', dateStr),
    raw: true
  });
  return rows.map((r) => Number(r.user_id));
}

async function findDistinctUserIdsWithListeningOn(dateStr) {
  const rows = await ListeningDictationAttempt.findAll({
    attributes: [[fn('DISTINCT', col('user_id')), 'user_id']],
    where: dateEqualsClause('submitted_at', dateStr),
    raw: true
  });
  return rows.map((r) => Number(r.user_id));
}

// Gộp cả 3 nguồn hoạt động (ôn từ vựng, làm bài đọc, làm bài nghe) trong một ngày cụ thể
async function findActiveUserIdsOnDate(dateStr) {
  const [reviewUserIds, readingUserIds, listeningUserIds] = await Promise.all([
    findDistinctUserIdsWithReviewOn(dateStr),
    findDistinctUserIdsWithReadingOn(dateStr),
    findDistinctUserIdsWithListeningOn(dateStr)
  ]);

  return new Set([...reviewUserIds, ...readingUserIds, ...listeningUserIds]);
}

async function findStreakByUserId(userId) {
  return Streak.findOne({ where: { user_id: userId } });
}

async function saveStreak(userId, fields) {
  const [streak] = await Streak.findOrCreate({
    where: { user_id: userId },
    defaults: { user_id: userId, current_streak: 0, longest_streak: 0, ...fields }
  });
  await streak.update(fields);
  return streak;
}

module.exports = {
  findAllActiveUserIds,
  findActiveUserIdsOnDate,
  findStreakByUserId,
  saveStreak
};
