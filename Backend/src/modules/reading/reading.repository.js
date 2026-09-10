const {
  ReadingArticle,
  ReadingQuestion,
  ReadingAttempt,
  AdminContentApprovalQueue
} = require('../../common/models');

async function findApprovedArticles({ difficulty, topic } = {}) {
  const where = { is_approved: true };
  if (difficulty) where.difficulty = difficulty;
  if (topic) where.topic = topic;

  return ReadingArticle.findAll({
    where,
    order: [['created_at', 'DESC']]
  });
}

async function findApprovedArticleWithQuestions(id) {
  return ReadingArticle.findOne({
    where: { id, is_approved: true },
    include: [{ model: ReadingQuestion, as: 'questions' }]
  });
}

async function findArticleWithQuestionsById(id) {
  return ReadingArticle.findOne({
    where: { id },
    include: [{ model: ReadingQuestion, as: 'questions' }]
  });
}

async function createArticle(data) {
  return ReadingArticle.create(data);
}

async function createQuestionsBulk(articleId, questions) {
  const rows = questions.map((q) => ({ ...q, article_id: articleId }));
  return ReadingQuestion.bulkCreate(rows);
}

async function findArticleWithQuestionsIncludingAnswers(id) {
  return ReadingArticle.findByPk(id, {
    include: [{ model: ReadingQuestion, as: 'questions' }]
  });
}

async function createAttempt(data) {
  return ReadingAttempt.create(data);
}

async function enqueueApproval(contentId) {
  return AdminContentApprovalQueue.create({
    content_type: 'reading_article',
    content_id: contentId,
    status: 'pending'
  });
}

module.exports = {
  findApprovedArticles,
  findApprovedArticleWithQuestions,
  findArticleWithQuestionsById,
  createArticle,
  createQuestionsBulk,
  findArticleWithQuestionsIncludingAnswers,
  createAttempt,
  enqueueApproval
};