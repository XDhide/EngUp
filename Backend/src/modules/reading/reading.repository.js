const {
  ReadingArticle,
  ReadingQuestion,
  ReadingAttempt,
  AdminContentApprovalQueue
} = require('../../common/models');

// ---------- Articles ----------

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
  // Dùng nội bộ cho submit/grading — không lọc is_approved vì lúc submit
  // article chắc chắn đã qua bước xem chi tiết (đã approved) trước đó.
  return ReadingArticle.findOne({
    where: { id },
    include: [{ model: ReadingQuestion, as: 'questions' }]
  });
}

async function createArticle(data) {
  return ReadingArticle.create(data);
}

async function findArticleById(id) {
  return ReadingArticle.findByPk(id);
}

async function updateArticle(article, fieldsToUpdate) {
  await article.update(fieldsToUpdate);
  return article;
}

async function deleteArticle(article) {
  // FK reading_questions/reading_attempts -> reading_articles là ON DELETE CASCADE.
  return article.destroy();
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

// ---------- Attempts ----------

async function createAttempt(data) {
  return ReadingAttempt.create(data);
}

// ---------- Admin approval queue (Reading chỉ INSERT, không đọc/sửa field khác) ----------

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
  findArticleById,
  updateArticle,
  deleteArticle,
  createQuestionsBulk,
  findArticleWithQuestionsIncludingAnswers,
  createAttempt,
  enqueueApproval
};