const { Sequelize } = require('sequelize');
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
    attributes: {
      include: [[
        Sequelize.literal('(SELECT COUNT(*) FROM reading_questions rq WHERE rq.article_id = ReadingArticle.id)'),
        'question_count'
      ]]
    },
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

async function findArticleById(id) {
  return ReadingArticle.findByPk(id);
}

async function updateArticle(article, fieldsToUpdate) {
  await article.update(fieldsToUpdate);
  return article;
}

async function deleteArticle(article) {
  // FK reading_questions / reading_attempts -> reading_articles là ON DELETE CASCADE.
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

async function findQuestionById(id) {
  return ReadingQuestion.findByPk(id);
}

async function createQuestion(articleId, data) {
  return ReadingQuestion.create({ ...data, article_id: articleId });
}

async function updateQuestion(question, fields) {
  await question.update(fields);
  return question;
}

async function deleteQuestion(question) {
  return question.destroy();
}

async function createAttempt(data) {
  return ReadingAttempt.create(data);
}

async function enqueueApproval(contentId, { submittedBy = null, title = null } = {}) {
  return AdminContentApprovalQueue.create({
    content_type: 'reading_article',
    content_id: contentId,
    status: 'pending',
    submitted_by: submittedBy,
    title: title ? String(title).slice(0, 255) : null
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
  findQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  findArticleWithQuestionsIncludingAnswers,
  createAttempt,
  enqueueApproval
};
