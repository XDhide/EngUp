const {
  User,
  UserTestAttempt,
  TestSet,
  ReadingAttempt,
  ReadingArticle,
  ListeningDictationAttempt,
  ListeningLesson,
  WritingPrompt,
  WritingSubmission
} = require('../../common/models');

const userInclude = { model: User, as: 'user', attributes: ['id', 'full_name', 'email'], required: false };

function page({ limit = 50, offset = 0 } = {}) {
  return { limit: Math.min(Number(limit) || 50, 200), offset: Number(offset) || 0 };
}

// ---------- Học viên: lịch sử của chính mình ----------
async function findReadingAttemptsOfUser(userId, opts) {
  return ReadingAttempt.findAll({
    where: { user_id: userId },
    include: [{ model: ReadingArticle, as: 'article', attributes: ['id', 'title', 'difficulty', 'topic'], required: false }],
    order: [['submitted_at', 'DESC'], ['id', 'DESC']],
    ...page(opts)
  });
}

async function findListeningAttemptsOfUser(userId, opts) {
  return ListeningDictationAttempt.findAll({
    where: { user_id: userId },
    include: [{ model: ListeningLesson, as: 'lesson', attributes: ['id', 'title', 'difficulty', 'topic'], required: false }],
    order: [['submitted_at', 'DESC'], ['id', 'DESC']],
    ...page(opts)
  });
}

// ---------- Admin: xem điểm ----------
async function findTestAttempts(testSetId, opts) {
  const where = testSetId ? { test_set_id: testSetId } : {};
  return UserTestAttempt.findAll({
    where,
    include: [userInclude, { model: TestSet, as: 'testSet', attributes: ['id', 'title', 'exam_type', 'section'], required: false }],
    order: [['started_at', 'DESC'], ['id', 'DESC']],
    ...page(opts)
  });
}

async function findReadingAttempts(articleId, opts) {
  const where = articleId ? { article_id: articleId } : {};
  return ReadingAttempt.findAll({
    where,
    include: [userInclude, { model: ReadingArticle, as: 'article', attributes: ['id', 'title'], required: false }],
    order: [['submitted_at', 'DESC'], ['id', 'DESC']],
    ...page(opts)
  });
}

async function findListeningAttempts(lessonId, opts) {
  const where = lessonId ? { lesson_id: lessonId } : {};
  return ListeningDictationAttempt.findAll({
    where,
    include: [userInclude, { model: ListeningLesson, as: 'lesson', attributes: ['id', 'title'], required: false }],
    order: [['submitted_at', 'DESC'], ['id', 'DESC']],
    ...page(opts)
  });
}

async function findWritingSubmissions(promptId, opts) {
  const where = promptId ? { prompt_id: promptId } : {};
  return WritingSubmission.findAll({
    where,
    include: [userInclude, { model: WritingPrompt, as: 'prompt', attributes: ['id', 'title'], required: false }],
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    ...page(opts)
  });
}

// ---------- Admin: đề bài viết ----------
async function findAllPrompts() {
  return WritingPrompt.findAll({ order: [['id', 'DESC']] });
}
async function findPromptById(id) {
  return WritingPrompt.findByPk(id);
}
async function createPrompt(data) {
  return WritingPrompt.create(data);
}
async function updatePrompt(prompt, patch) {
  await prompt.update(patch);
  return prompt;
}
async function deletePrompt(prompt) {
  return prompt.destroy();
}

module.exports = {
  findReadingAttemptsOfUser,
  findListeningAttemptsOfUser,
  findTestAttempts,
  findReadingAttempts,
  findListeningAttempts,
  findWritingSubmissions,
  findAllPrompts,
  findPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt
};
