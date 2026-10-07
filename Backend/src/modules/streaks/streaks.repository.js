const { Op } = require('sequelize');
const {
  Streak,
  User,
  ReviewLog,
  ReadingAttempt,
  ListeningDictationAttempt,
  UserTestAttempt,
  WritingSubmission
} = require('../../common/models');

async function findAllActiveUserIds() {
  const users = await User.findAll({
    attributes: ['id'],
    where: { is_active: true },
    raw: true
  });
  return users.map((u) => Number(u.id));
}

async function distinctUserIds(Model, column, start, end) {
  const rows = await Model.findAll({
    attributes: ['user_id'],
    where: { [column]: { [Op.gte]: start, [Op.lt]: end } },
    group: ['user_id'],
    raw: true
  });
  return rows.map((r) => Number(r.user_id));
}

const ACTIVITY_SOURCES = [
  ['review', ReviewLog, 'reviewed_at'],
  ['reading', ReadingAttempt, 'submitted_at'],
  ['listening', ListeningDictationAttempt, 'submitted_at'],
  ['test', UserTestAttempt, 'submitted_at'],
  ['writing', WritingSubmission, 'created_at']
];

async function findActiveUserIdsInRange(start, end) {
  const lists = await Promise.all(ACTIVITY_SOURCES.map(([, Model, col]) => distinctUserIds(Model, col, start, end)));
  return new Set(lists.flat());
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
  findActiveUserIdsInRange,
  findStreakByUserId,
  saveStreak,
  ACTIVITY_SOURCES
};
