const {
  sequelize,
  TestSet,
  TestQuestion,
  UserTestAttempt,
  AuditLog
} = require('../../common/models');

// ---------- Transaction ----------

// Managed transaction: callback throw -> rollback, resolve -> commit.
async function withTransaction(callback) {
  return sequelize.transaction(callback);
}

// ---------- Đề thi ----------

async function findTestSetById(id, transaction) {
  return TestSet.findByPk(id, { transaction });
}

async function createTestSet(data, transaction) {
  return TestSet.create(data, { transaction });
}

async function updateTestSet(testSet, patch, transaction) {
  return testSet.update(patch, { transaction });
}

async function destroyTestSet(testSet, transaction) {
  return testSet.destroy({ transaction }); // câu hỏi thuộc đề bị xoá theo (ON DELETE CASCADE)
}

async function countQuestionsOfTestSet(testSetId, transaction) {
  return TestQuestion.count({ where: { test_set_id: testSetId }, transaction });
}

// ---------- Câu hỏi ----------

async function findQuestionById(id, transaction) {
  return TestQuestion.findByPk(id, { transaction });
}

async function createQuestion(data, transaction) {
  return TestQuestion.create(data, { transaction });
}

async function updateQuestion(question, patch, transaction) {
  return question.update(patch, { transaction });
}

async function destroyQuestion(question, transaction) {
  return question.destroy({ transaction });
}

// ---------- Lượt làm bài (chỉ ĐỌC, bảng thuộc luồng làm bài của học viên) ----------

async function countAttemptsOfTestSet(testSetId, transaction) {
  return UserTestAttempt.count({ where: { test_set_id: testSetId }, transaction });
}

async function findAttemptsOfTestSet(testSetId) {
  return UserTestAttempt.findAll({
    where: { test_set_id: testSetId },
    attributes: ['user_id', 'score', 'band_score', 'status'],
    order: [
      ['started_at', 'DESC'],
      ['id', 'DESC']
    ]
  });
}

// ---------- Audit log ----------

async function createAuditLog({ actor_id, action, target_type, target_id, detail = null }, transaction) {
  return AuditLog.create({ actor_id, action, target_type, target_id, detail }, { transaction });
}

module.exports = {
  withTransaction,
  findTestSetById,
  createTestSet,
  updateTestSet,
  destroyTestSet,
  countQuestionsOfTestSet,
  findQuestionById,
  createQuestion,
  updateQuestion,
  destroyQuestion,
  countAttemptsOfTestSet,
  findAttemptsOfTestSet,
  createAuditLog
};
