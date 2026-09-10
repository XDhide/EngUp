const { Op } = require('sequelize');
const { WritingPrompt, WritingSubmission } = require('../../common/models');

async function findPrompts({ type } = {}) {
  const where = {};
  if (type) where.type = type;

  return WritingPrompt.findAll({
    where,
    order: [['id', 'ASC']]
  });
}

async function findPromptById(id) {
  return WritingPrompt.findByPk(id);
}

async function createSubmission({ user_id, prompt_id, content, ai_feedback, ai_score }) {
  return WritingSubmission.create({
    user_id,
    prompt_id,
    content,
    ai_feedback,
    ai_score
  });
}

async function findSubmissionByIdForUser(id, userId) {
  return WritingSubmission.findOne({
    where: { id, user_id: userId }
  });
}

async function findSubmissionsForUser(userId, { limit = 20, offset = 0 } = {}) {
  const { rows, count } = await WritingSubmission.findAndCountAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit,
    offset
  });

  return { submissions: rows, total: count };
}

// Đếm số bài đã được chấm AI trong ngày hôm nay (theo giờ server) của 1 user — phục vụ checkWritingQuota.
async function countTodaySubmissions(userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return WritingSubmission.count({
    where: {
      user_id: userId,
      created_at: { [Op.gte]: startOfDay }
    }
  });
}

module.exports = {
  findPrompts,
  findPromptById,
  createSubmission,
  findSubmissionByIdForUser,
  findSubmissionsForUser,
  countTodaySubmissions
};
