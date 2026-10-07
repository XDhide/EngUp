const readingRepository = require('./reading.repository');
const { touchActivity } = require('../streaks/streaks.service');
const AppError = require('../../common/utils/AppError');
const {
  toArticleListItemDto,
  toArticleDetailDto,
  toArticleAdminDto,
  toQuestionAdminDto
} = require('./reading.dtos');
const { normalizeReadingQuestion } = require('./reading.questions.util');

const AI_GENERATION_URL = process.env.AI_GENERATION_URL;
const AI_GENERATION_TIMEOUT_MS = 15000;
function assertAdmin(requester) {
  if (!requester || requester.role !== 'admin') {
    throw new AppError('Chỉ admin mới có quyền thao tác này', 403);
  }
}

async function getArticles({ difficulty, topic }) {
  const articles = await readingRepository.findApprovedArticles({ difficulty, topic });
  return { articles: articles.map(toArticleListItemDto) };
}

async function getArticleDetail(articleId) {
  const article = await readingRepository.findApprovedArticleWithQuestions(articleId);
  if (!article) {
    throw new AppError('Bài đọc không tồn tại hoặc chưa được duyệt', 404);
  }
  return toArticleDetailDto(article);
}

async function submitArticle(userId, articleId, answers) {
  const article = await readingRepository.findArticleWithQuestionsById(articleId);
  if (!article || !article.is_approved) {
    throw new AppError('Bài đọc không tồn tại hoặc chưa được duyệt', 404);
  }

  const answerMap = new Map((answers || []).map((a) => [Number(a.question_id), a.answer]));
  const questions = article.questions || [];

  let correctCount = 0;
  const review = questions.map((q) => {
    const submittedAnswer = answerMap.get(q.id);
    const isCorrect = submittedAnswer !== undefined &&
      String(submittedAnswer).trim().toUpperCase() === String(q.correct_answer).trim().toUpperCase();
    if (isCorrect) correctCount += 1;
    return {
      question_id: q.id,
      correct_answer: q.correct_answer,
      is_correct: isCorrect
    };
  });

  const totalCount = questions.length;
  const score = totalCount > 0 ? Number(((correctCount / totalCount) * 100).toFixed(2)) : 0;

  await readingRepository.createAttempt({
    user_id: userId,
    article_id: articleId,
    answers,
    score,
    correct_count: correctCount,
    total_count: totalCount
  });
  touchActivity(userId);

  return { score, correct_count: correctCount, total_count: totalCount, review };
}

async function callAiGeneration(topic, difficulty) {
  if (!AI_GENERATION_URL) {
    throw new AppError('Chưa cấu hình AI_GENERATION_URL để sinh bài đọc', 502);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_GENERATION_TIMEOUT_MS);

  try {
    const res = await fetch(`${AI_GENERATION_URL}/generate-reading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, difficulty }),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new AppError('AI sinh bài đọc thất bại', 502);
    }

    const data = await res.json();

    if (!data.title || !data.content || !Array.isArray(data.questions) || data.questions.length === 0) {
      throw new AppError('Kết quả AI trả về không hợp lệ', 502);
    }
    return data;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Không thể sinh bài đọc, thử lại sau', 502);
  } finally {
    clearTimeout(timeout);
  }
}

async function generateArticle(requester, { topic, difficulty }) {
  assertAdmin(requester);

  const generated = await callAiGeneration(topic, difficulty);

  const article = await readingRepository.createArticle({
    title: generated.title,
    content: generated.content,
    difficulty,
    topic,
    is_ai_generated: true,
    is_approved: false,
    created_by: null
  });

  await readingRepository.createQuestionsBulk(article.id, generated.questions);
  await readingRepository.enqueueApproval(article.id, { submittedBy: null, title: generated.title });

  const fullArticle = await readingRepository.findArticleWithQuestionsIncludingAnswers(article.id);
  return toArticleAdminDto(fullArticle);
}

// ---- Admin tạo/sửa/xoá bài đọc thủ công (không qua hàng đợi duyệt: admin tự đăng nên duyệt luôn) ----
async function createArticleManual(requester, { title, content, difficulty, topic, questions }) {
  assertAdmin(requester);
  const normalized = Array.isArray(questions)
    ? questions.map((q, i) => normalizeReadingQuestion(q, `Câu hỏi ${i + 1}`))
    : [];
  const article = await readingRepository.createArticle({
    title: title.trim(),
    content: content.trim(),
    difficulty: difficulty || null,
    topic: topic || null,
    is_ai_generated: false,
    is_approved: true,
    created_by: requester.id
  });
  if (normalized.length) await readingRepository.createQuestionsBulk(article.id, normalized);
  const full = await readingRepository.findArticleWithQuestionsIncludingAnswers(article.id);
  return toArticleAdminDto(full);
}

async function getArticleAdminDetail(requester, articleId) {
  assertAdmin(requester);
  const article = await readingRepository.findArticleWithQuestionsById(articleId);
  if (!article) throw new AppError('Bài đọc không tồn tại', 404);
  const dto = toArticleAdminDto(article);
  dto.questions.sort((a, b) => a.id - b.id);
  return dto;
}

async function addQuestionManual(requester, articleId, body) {
  assertAdmin(requester);
  const article = await readingRepository.findArticleById(articleId);
  if (!article) throw new AppError('Bài đọc không tồn tại', 404);
  const data = normalizeReadingQuestion(body);
  const created = await readingRepository.createQuestion(article.id, data);
  return toQuestionAdminDto(created);
}

async function updateQuestionManual(requester, questionId, body) {
  assertAdmin(requester);
  const question = await readingRepository.findQuestionById(questionId);
  if (!question) throw new AppError('Câu hỏi không tồn tại', 404);
  const merged = {
    question_text: body.question_text !== undefined ? body.question_text : question.question_text,
    options: body.options !== undefined ? body.options : question.options,
    correct_answer: body.correct_answer !== undefined ? body.correct_answer : question.correct_answer,
    explanation: body.explanation !== undefined ? body.explanation : question.explanation
  };
  const data = normalizeReadingQuestion(merged);
  const updated = await readingRepository.updateQuestion(question, data);
  return toQuestionAdminDto(updated);
}

async function deleteQuestionManual(requester, questionId) {
  assertAdmin(requester);
  const question = await readingRepository.findQuestionById(questionId);
  if (!question) throw new AppError('Câu hỏi không tồn tại', 404);
  await readingRepository.deleteQuestion(question);
  return null;
}

async function updateArticleManual(requester, articleId, fields) {
  assertAdmin(requester);
  const article = await readingRepository.findArticleById(articleId);
  if (!article) {
    throw new AppError('Bài đọc không tồn tại', 404);
  }
  const allowed = {};
  ['title', 'content', 'difficulty', 'topic'].forEach((k) => {
    if (fields[k] !== undefined) allowed[k] = typeof fields[k] === 'string' ? fields[k].trim() : fields[k];
  });
  const updated = await readingRepository.updateArticle(article, allowed);
  return toArticleAdminDto(updated);
}

async function deleteArticleManual(requester, articleId) {
  assertAdmin(requester);
  const article = await readingRepository.findArticleById(articleId);
  if (!article) {
    throw new AppError('Bài đọc không tồn tại', 404);
  }
  await readingRepository.deleteArticle(article);
  return null;
}

module.exports = {
  getArticleAdminDetail,
  addQuestionManual,
  updateQuestionManual,
  deleteQuestionManual,
  createArticleManual,
  updateArticleManual,
  deleteArticleManual,
  getArticles,
  getArticleDetail,
  submitArticle,
  generateArticle
};
