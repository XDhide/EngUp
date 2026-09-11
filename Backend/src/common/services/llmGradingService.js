const AppError = require('../utils/AppError');

// Tách từ writing.service.js (bản gốc do đồng đội viết) để dùng chung cho
// mọi module cần chấm bài bằng AI (Writing, Test Practice Writing/Speaking...).
// Vẫn dùng chung env var WRITING_LLM_* vì đây là "LLM engine của Module Writing"
// theo đúng mô tả nhiệm vụ Test Practice — không tạo bộ key riêng.
const GEMINI_API_KEY = process.env.WRITING_LLM_API_KEY;
const GEMINI_MODEL = process.env.WRITING_LLM_MODEL || 'gemini-2.0-flash';
const GEMINI_API_BASE_URL = process.env.WRITING_LLM_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_TIMEOUT_MS = 15000;

function buildGeminiUrl() {
  return `${GEMINI_API_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
}

/**
 * Gọi Gemini với 1 system prompt + 1 user prompt, kỳ vọng model trả JSON thuần
 * (responseMimeType: application/json). Trả về object đã JSON.parse.
 * Caller tự validate cấu trúc theo rubric riêng của mình — Writing và Test Practice
 * kỳ vọng 2 shape JSON khác nhau, nên hàm này KHÔNG validate field cụ thể.
 */
async function callLlmForJson({ systemPrompt, userPrompt, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!GEMINI_API_KEY) {
    throw new AppError('Chưa cấu hình WRITING_LLM_API_KEY để chấm bài bằng AI', 502);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(buildGeminiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new AppError('AI chấm bài thất bại', 502);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new AppError('Kết quả AI trả về không hợp lệ', 502);
    }

    try {
      return JSON.parse(rawText);
    } catch (parseErr) {
      throw new AppError('Kết quả AI trả về không đúng định dạng JSON', 502);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AppError('Quá thời gian chấm bài, vui lòng thử lại sau', 504);
    }
    if (err instanceof AppError) throw err;
    throw new AppError('Không thể chấm bài, thử lại sau', 502);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { callLlmForJson };