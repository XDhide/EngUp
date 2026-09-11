const testRepository = require('./test.Repository');
const AppError = require('../../common/utils/AppError');
const { callLlmForJson } = require('../../common/services/llmGradingService');
const {
  toTestSetListItemDto,
  toQuestionForAttemptDto,
  toAttemptListItemDto
} = require('./test.dtos');

const GRADABLE_QUESTION_TYPES = ['multiple_choice', 'fill_blank'];
const AI_GRADED_QUESTION_TYPES = ['essay', 'speaking_prompt'];


async function getTestSets({ exam_type, section }) {
  const testSets = await testRepository.findTestSets({ exam_type, section });
  return { test_sets: testSets.map(toTestSetListItemDto) };
}

async function getQuestions(testSetId) {
  const testSet = await testRepository.findTestSetById(testSetId);
  if (!testSet) {
    throw new AppError('Đề thi không tồn tại', 404);
  }
  const questions = await testRepository.findQuestionsByTestSetId(testSetId);
  return { questions: questions.map(toQuestionForAttemptDto) };
}


async function startAttempt(userId, testSetId) {
  const testSet = await testRepository.findTestSetById(testSetId);
  if (!testSet) {
    throw new AppError('Đề thi không tồn tại', 404);
  }

  const attempt = await testRepository.createAttempt({
    user_id: userId,
    test_set_id: testSetId,
    started_at: new Date()
  });

  return {
    attempt_id: attempt.id,
    started_at: attempt.started_at,
    time_limit_minutes: testSet.time_limit_minutes
  };
}


function convertScoreToBand(examType, scorePercent) {
  if (scorePercent === null || scorePercent === undefined) return null;
  if (examType === 'IELTS') {
    return Math.round((scorePercent / 100) * 9 * 2) / 2; 
  }
  return Math.round((scorePercent / 100) * 990); 
}

async function submitAttempt(userId, { attempt_id, answers }) {
  const attempt = await testRepository.findAttemptWithTestSetForUser(attempt_id, userId);
  if (!attempt) {
    throw new AppError('Lượt làm bài không tồn tại', 404);
  }
  if (attempt.status === 'submitted') {
    throw new AppError('Lượt làm bài này đã được nộp trước đó', 409);
  }

  const questions = attempt.testSet.questions || [];
  const gradableQuestions = questions.filter((q) => GRADABLE_QUESTION_TYPES.includes(q.question_type));
  const answerMap = new Map((answers || []).map((a) => [Number(a.question_id), a.answer]));

  let correctCount = 0;
  gradableQuestions.forEach((q) => {
    if (answerMap.get(q.id) === q.correct_answer) correctCount += 1;
  });

  const totalCount = gradableQuestions.length;
  const score = totalCount > 0 ? Number(((correctCount / totalCount) * 100).toFixed(2)) : null;
  const bandScore = convertScoreToBand(attempt.testSet.exam_type, score);

  await testRepository.updateAttempt(attempt, {
    answers,
    score,
    band_score: bandScore,
    submitted_at: new Date(),
    status: 'submitted'
  });

  return { score, band_score: bandScore };
}


function buildExamGradingPrompt(examType, section) {
  const scaleText =
    examType === 'IELTS'
      ? '"band_score" là số thang điểm IELTS từ 0 đến 9, có thể lẻ 0.5'
      : '"band_score" là số thang điểm TOEIC từ 0 đến 200';

  return `Bạn là giám khảo chấm thi ${examType} phần ${section}.
Chấm bài làm của thí sinh theo đúng tiêu chí chấm thi ${examType} thật (task achievement/response, coherence, ngữ pháp, từ vựng, phát âm/trôi chảy nếu là speaking).
CHỈ trả lời bằng một object JSON hợp lệ duy nhất, không thêm văn bản/markdown khác, đúng cấu trúc:
{
  "band_score": 0,
  "feedback": "nhận xét chi tiết bằng tiếng Việt theo từng tiêu chí"
}
${scaleText}.`;
}

async function submitWriting(userId, testSetId, { attempt_id, content }) {
  const attempt = await testRepository.findAttemptWithTestSetForUser(attempt_id, userId);
  if (!attempt || attempt.test_set_id !== Number(testSetId)) {
    throw new AppError('Lượt làm bài không tồn tại', 404);
  }
  if (attempt.status === 'submitted') {
    throw new AppError('Lượt làm bài này đã được nộp trước đó', 409);
  }

  const { testSet } = attempt;
  const promptQuestion = (testSet.questions || []).find((q) => AI_GRADED_QUESTION_TYPES.includes(q.question_type));
  if (!promptQuestion) {
    throw new AppError('Đề thi này không có câu hỏi Writing/Speaking để chấm AI', 400);
  }

  const systemPrompt = buildExamGradingPrompt(testSet.exam_type, testSet.section);
  const userPrompt = `Đề bài: ${promptQuestion.question_text}\n\nBài làm của thí sinh:\n${content}`;

  const parsed = await callLlmForJson({ systemPrompt, userPrompt });

  if (typeof parsed.band_score !== 'number' || typeof parsed.feedback !== 'string') {
    throw new AppError('Kết quả AI trả về thiếu trường dữ liệu bắt buộc', 502);
  }

  await testRepository.updateAttempt(attempt, {
    answers: { content },
    band_score: parsed.band_score,
    submitted_at: new Date(),
    status: 'submitted'
  });

  return { band_score: parsed.band_score, feedback: parsed.feedback };
}


async function getAttemptResult(userId, attemptId) {
  const attempt = await testRepository.findAttemptWithTestSetForUser(attemptId, userId);
  if (!attempt) {
    throw new AppError('Lượt làm bài không tồn tại', 404);
  }

  let answersReview = null;

  // Bài trắc nghiệm: answers là mảng [{question_id, answer}] -> so sánh với correct_answer.
  // Bài Writing/Speaking: answers là { content } -> không có gì để so sánh đúng/sai,
  // feedback chi tiết đã được trả về ngay lúc submit-writing, không lưu lại ở đây.
  if (Array.isArray(attempt.answers)) {
    const answerMap = new Map(attempt.answers.map((a) => [Number(a.question_id), a.answer]));
    const gradableQuestions = (attempt.testSet.questions || []).filter((q) =>
      GRADABLE_QUESTION_TYPES.includes(q.question_type)
    );
    answersReview = gradableQuestions.map((q) => ({
      question_id: q.id,
      your_answer: answerMap.get(q.id) ?? null,
      correct_answer: q.correct_answer,
      is_correct: answerMap.get(q.id) === q.correct_answer
    }));
  }

  return {
    score: attempt.score,
    band_score: attempt.band_score,
    answers_review: answersReview
  };
}

async function getAttempts(userId, { limit, offset }) {
  const { attempts } = await testRepository.findAttemptsForUser(userId, {
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined
  });
  return { attempts: attempts.map(toAttemptListItemDto) };
}

module.exports = {
  getTestSets,
  getQuestions,
  startAttempt,
  submitAttempt,
  submitWriting,
  getAttemptResult,
  getAttempts
};
