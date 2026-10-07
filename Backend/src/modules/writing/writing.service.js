const { touchActivity } = require('../streaks/streaks.service');
const writingRepository = require('./writing.repository');
const AppError = require('../../common/utils/AppError');
const {
  toPromptListItemDto,
  toSubmissionResultDto,
  toSubmissionDetailDto,
  toSubmissionListItemDto
} = require('./writing.dtos');

const { callLlmForJson } = require('../../common/services/llmGradingService');

const GRADING_SYSTEM_PROMPT = `Bạn là giáo viên tiếng Anh có kinh nghiệm chấm bài luận cho học viên.
Chấm bài viết dựa trên đề bài được cung cấp, đánh giá về nội dung, ngữ pháp, từ vựng.
CHỈ trả lời bằng một object JSON hợp lệ duy nhất, không thêm bất kỳ văn bản, markdown hay giải thích nào khác, đúng cấu trúc sau:
{
  "overall_comment": "nhận xét tổng quan bằng tiếng Việt",
  "grammar_errors": ["liệt kê từng lỗi ngữ pháp cụ thể"],
  "vocabulary_suggestions": ["gợi ý từ vựng/cách diễn đạt tốt hơn"],
  "score": 0
}
"score" là số từ 0 đến 100.`;

async function callAiGrading(promptText, content) {
  // Dùng chung common/services/llmGradingService (retry, model dự phòng, báo đúng nguyên nhân lỗi).
  const parsed = await callLlmForJson({
    systemPrompt: GRADING_SYSTEM_PROMPT,
    userPrompt: `Đề bài: ${promptText}\n\nBài làm của học viên:\n${content}`
  });

  if (
    !parsed.overall_comment ||
    !Array.isArray(parsed.grammar_errors) ||
    !Array.isArray(parsed.vocabulary_suggestions) ||
    typeof parsed.score !== 'number'
  ) {
    throw new AppError('Kết quả AI trả về thiếu trường dữ liệu bắt buộc', 502);
  }

  return {
    ai_feedback: {
      overall_comment: parsed.overall_comment,
      grammar_errors: parsed.grammar_errors,
      vocabulary_suggestions: parsed.vocabulary_suggestions
    },
    ai_score: parsed.score
  };
}

async function getPrompts({ type }) {
  const prompts = await writingRepository.findPrompts({ type });
  return { prompts: prompts.map(toPromptListItemDto) };
}

async function createSubmission(userId, { prompt_id, content }) {
  const prompt = await writingRepository.findPromptById(prompt_id);
  if (!prompt) {
    throw new AppError('Đề bài không tồn tại', 404);
  }

  const { ai_feedback, ai_score } = await callAiGrading(prompt.prompt_text, content);

  const submission = await writingRepository.createSubmission({
    user_id: userId,
    prompt_id: prompt.id,
    content,
    ai_feedback,
    ai_score
  });
  touchActivity(userId);

  return toSubmissionResultDto(submission);
}

async function getSubmissionDetail(userId, submissionId) {
  const submission = await writingRepository.findSubmissionByIdForUser(submissionId, userId);
  if (!submission) {
    throw new AppError('Bài nộp không tồn tại', 404);
  }
  return toSubmissionDetailDto(submission);
}

async function getSubmissions(userId, { limit, offset }) {
  const { submissions } = await writingRepository.findSubmissionsForUser(userId, { limit, offset });
  return { submissions: submissions.map(toSubmissionListItemDto) };
}

module.exports = {
  getPrompts,
  createSubmission,
  getSubmissionDetail,
  getSubmissions
};
