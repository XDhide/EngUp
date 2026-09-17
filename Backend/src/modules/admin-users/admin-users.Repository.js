const { Op, fn, col } = require('sequelize');
const {
  User,
  AuditLog,
  ReviewLog,
  ReadingAttempt,
  ListeningDictationAttempt
} = require('../../common/models');

const USER_PUBLIC_ATTRIBUTES = [
  'id',
  'email',
  'full_name',
  'role',
  'level_current',
  'learning_goal',
  'daily_target_minutes',
  'daily_new_word_limit',
  'is_active',
  'created_at',
  'updated_at'
];

// ---------- Users ----------

async function findUsers({ search, status, page = 1, pageSize = 20 } = {}) {
  const where = {};

  if (search) {
    where[Op.or] = [{ email: { [Op.like]: `%${search}%` } }, { full_name: { [Op.like]: `%${search}%` } }];
  }
  if (status === 'active') where.is_active = true;
  if (status === 'inactive') where.is_active = false;

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: USER_PUBLIC_ATTRIBUTES, // không bao giờ trả password_hash
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize
  });

  return { users: rows, total: count };
}

async function findUserById(id) {
  return User.findByPk(id, { attributes: USER_PUBLIC_ATTRIBUTES });
}

async function updateUserStatus(id, isActive) {
  await User.update({ is_active: isActive }, { where: { id } });
  return findUserById(id);
}

// ---------- Audit log (bảng do chính Admin sở hữu) ----------

async function createAuditLog({ actor_id, action, target_type, target_id, detail }) {
  return AuditLog.create({ actor_id, action, target_type, target_id, detail });
}

// ---------- Thống kê tiến độ (read-only từ bảng của module khác) ----------

async function getVocabularyProgress(userId) {
  const total = await ReviewLog.count({ where: { user_id: userId } });
  const correct = await ReviewLog.count({
    where: { user_id: userId, result: { [Op.in]: ['good', 'easy'] } }
  });
  const lastReviewedAt = await ReviewLog.max('reviewed_at', { where: { user_id: userId } });

  return { total_reviews: total, correct_reviews: correct, last_reviewed_at: lastReviewedAt || null };
}

async function getReadingProgress(userId) {
  const result = await ReadingAttempt.findOne({
    where: { user_id: userId },
    attributes: [
      [fn('COUNT', col('id')), 'total_attempts'],
      [fn('AVG', col('score')), 'average_score'],
      [fn('MAX', col('submitted_at')), 'last_submitted_at']
    ],
    raw: true
  });

  return {
    total_attempts: Number(result?.total_attempts || 0),
    average_score: result?.average_score !== null ? Number(result.average_score) : null,
    last_submitted_at: result?.last_submitted_at || null
  };
}

async function getListeningProgress(userId) {
  const result = await ListeningDictationAttempt.findOne({
    where: { user_id: userId },
    attributes: [
      [fn('COUNT', col('id')), 'total_attempts'],
      [fn('AVG', col('accuracy_percent')), 'average_accuracy'],
      [fn('MAX', col('submitted_at')), 'last_submitted_at']
    ],
    raw: true
  });

  return {
    total_attempts: Number(result?.total_attempts || 0),
    average_accuracy: result?.average_accuracy !== null ? Number(result.average_accuracy) : null,
    last_submitted_at: result?.last_submitted_at || null
  };
}

module.exports = {
  findUsers,
  findUserById,
  updateUserStatus,
  createAuditLog,
  getVocabularyProgress,
  getReadingProgress,
  getListeningProgress
};
