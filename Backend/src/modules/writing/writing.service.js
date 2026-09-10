const writingRepository = require('./writing.repository');
const AppError = require('../../common/utils/AppError');
const {
  toPromptListItemDto,
  toSubmissionResultDto,
  toSubmissionDetailDto,
  toSubmissionListItemDto
} = require('./writing.dtos');

// Gọi thẳng Gemini API (Google Generative Language API) bằng API key.
const GEMINI_API_KEY = process.env.WRITING_LLM_API_KEY;
const GEMINI_MODEL = process.env.WRITING_LLM_MODEL || 'gemini-2.0-flash';
const GEMINI_API_BASE_URL = process.env.WRITING_LLM_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
const AI_GRADING_TIMEOUT_MS = 15000;

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

function buildGeminiUrl() {
  return `${GEMINI_API_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
}

async function callAiGrading(promptText, content) {
  if (!GEMINI_API_KEY) {
    throw new AppError('Chưa cấu hình WRITING_LLM_API_KEY để chấm bài viết bằng AI', 502);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_GRADING_TIMEOUT_MS);

  try {
    const res = await fetch(buildGeminiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: GRADING_SYSTEM_PROMPT }] },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Đề bài: ${promptText}\n\nBài làm của học viên:\n${content}` }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new AppError('AI chấm bài viết thất bại', 502);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new AppError('Kết quả AI trả về không hợp lệ', 502);
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      throw new AppError('Kết quả AI trả về không đúng định dạng JSON', 502);
    }

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
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AppError('Quá thời gian chấm bài, vui lòng thử lại sau', 504);
    }
    if (err instanceof AppError) throw err;
    throw new AppError('Không thể chấm bài viết, thử lại sau', 502);
  } finally {
    clearTimeout(timeout);
  }
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
