const readingRepository = require('./reading.repository');
const AppError = require('../../common/utils/AppError');
const {
  toArticleListItemDto,
  toArticleDetailDto,
  toArticleAdminDto
} = require('./reading.dtos');

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
    const isCorrect = submittedAnswer !== undefined && submittedAnswer === q.correct_answer;
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
  await readingRepository.enqueueApproval(article.id);

  const fullArticle = await readingRepository.findArticleWithQuestionsIncludingAnswers(article.id);
  return toArticleAdminDto(fullArticle);
}

module.exports = {
  getArticles,
  getArticleDetail,
  submitArticle,
  generateArticle
};