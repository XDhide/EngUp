const { TestSet, TestQuestion, UserTestAttempt } = require('../../common/models');

async function findTestSets({ exam_type, section } = {}) {
  const where = {};
  if (exam_type) where.exam_type = exam_type;
  if (section) where.section = section;
  return TestSet.findAll({ where, order: [['created_at', 'DESC']] });
}

async function findTestSetById(id) {
  return TestSet.findByPk(id);
}

async function findQuestionsByTestSetId(testSetId) {
  return TestQuestion.findAll({
    where: { test_set_id: testSetId },
    order: [['order_index', 'ASC']]
  });
}


async function createAttempt({ user_id, test_set_id, started_at }) {
  return UserTestAttempt.create({
    user_id,
    test_set_id,
    started_at,
    status: 'in_progress'
  });
}

async function findAttemptByIdForUser(id, userId) {
  return UserTestAttempt.findOne({ where: { id, user_id: userId } });
}

async function findAttemptWithTestSetForUser(id, userId) {
  return UserTestAttempt.findOne({
    where: { id, user_id: userId },
    include: [{ model: TestSet, as: 'testSet', include: [{ model: TestQuestion, as: 'questions' }] }]
  });
}

async function updateAttempt(attempt, fieldsToUpdate) {
  await attempt.update(fieldsToUpdate);
  return attempt;
}

async function findAttemptsForUser(userId, { limit = 20, offset = 0 } = {}) {
  const { rows, count } = await UserTestAttempt.findAndCountAll({
    where: { user_id: userId },
    order: [['started_at', 'DESC']],
    limit,
    offset
  });
  return { attempts: rows, total: count };
}

module.exports = {
  findTestSets,
  findTestSetById,
  findQuestionsByTestSetId,
  createAttempt,
  findAttemptByIdForUser,
  findAttemptWithTestSetForUser,
  updateAttempt,
  findAttemptsForUser
};
