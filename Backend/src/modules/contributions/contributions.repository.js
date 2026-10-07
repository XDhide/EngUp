const { Op } = require('sequelize');
const {
  sequelize,
  AdminContentApprovalQueue,
  ReadingArticle,
  ReadingQuestion,
  TestSet,
  TestQuestion,
  VocabularyWord,
  VocabularyTopic
} = require('../../common/models');

const withTransaction = (cb) => sequelize.transaction(cb);

async function countPendingByUser(userId) {
  return AdminContentApprovalQueue.count({ where: { submitted_by: userId, status: 'pending' } });
}

async function findWordByText(word) {
  return VocabularyWord.findOne({ where: { word } });
}

async function findTopicById(id) {
  return VocabularyTopic.findByPk(id);
}

async function findTestSetById(id) {
  return TestSet.findByPk(id);
}

async function maxQuestionOrder(testSetId) {
  const max = await TestQuestion.max('order_index', { where: { test_set_id: testSetId } });
  return Number.isFinite(Number(max)) ? Number(max) : 0;
}

async function createQueue(data, transaction) {
  return AdminContentApprovalQueue.create({ ...data, status: 'pending' }, { transaction });
}

async function createReading(article, questions, transaction) {
  const created = await ReadingArticle.create(article, { transaction });
  if (questions.length) {
    await ReadingQuestion.bulkCreate(questions.map((q) => ({ ...q, article_id: created.id })), { transaction });
  }
  return created;
}

async function createWord(data, transaction) {
  return VocabularyWord.create(data, { transaction });
}

async function createTestQuestion(data, transaction) {
  return TestQuestion.create(data, { transaction });
}

async function findMine(userId, limit = 50) {
  return AdminContentApprovalQueue.findAll({
    where: { submitted_by: userId },
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    limit
  });
}

async function findMineById(id, userId) {
  return AdminContentApprovalQueue.findOne({ where: { id, submitted_by: userId } });
}

async function deletePending(item) {
  return withTransaction(async (transaction) => {
    const where = { id: item.content_id };
    if (item.content_type === 'reading_article') await ReadingArticle.destroy({ where: { ...where, is_approved: false }, transaction });
    if (item.content_type === 'vocabulary_word') await VocabularyWord.destroy({ where: { ...where, is_approved: false }, transaction });
    if (item.content_type === 'test_question') await TestQuestion.destroy({ where: { ...where, is_approved: false }, transaction });
    await item.destroy({ transaction });
  });
}

module.exports = {
  withTransaction,
  countPendingByUser,
  findWordByText,
  findTopicById,
  findTestSetById,
  maxQuestionOrder,
  createQueue,
  createReading,
  createWord,
  createTestQuestion,
  findMine,
  findMineById,
  deletePending,
  Op
};
