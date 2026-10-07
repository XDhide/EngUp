const AppError = require('../utils/AppError');

const GEMINI_API_KEY = process.env.WRITING_LLM_API_KEY;
const GEMINI_API_BASE_URL = (process.env.WRITING_LLM_API_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2; // thử lại khi 429/5xx/timeout

// Model chính lấy từ .env; nếu model đó bị ngừng (404) hoặc hết quota thì thử lần lượt các model dự phòng.
const STATIC_MODELS = [...new Set([
  process.env.WRITING_LLM_MODEL,
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash'
].filter(Boolean))];

let discoveredModels = null; // cache kết quả ListModels

// Hỏi Google key này đang dùng được những model nào (Google gỡ model cũ khá thường xuyên).
async function discoverModels() {
  if (discoveredModels) return discoveredModels;
  try {
    const res = await fetch(`${GEMINI_API_BASE_URL}/models?pageSize=200`, { headers: { 'x-goog-api-key': GEMINI_API_KEY } });
    if (!res.ok) return [];
    const data = await res.json();
    const names = (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => String(m.name).replace(/^models\//, ''))
      .filter((n) => /^gemini-[\d.]+-flash(-lite)?$|^gemini-flash-(lite-)?latest$/.test(n)); // chỉ lấy bản flash ổn định
    // Ưu tiên phiên bản mới nhất
    discoveredModels = names.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  } catch {
    discoveredModels = [];
  }
  return discoveredModels;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractJson(rawText) {
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const m = cleaned.match(/\{[\s\S]*\}/); // lấy object JSON đầu tiên nếu model kèm thêm chữ
    if (m) return JSON.parse(m[0]);
    throw e;
  }
}

async function callOnce(model, { systemPrompt, userPrompt, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Key gửi qua header, không để trong URL để khỏi lộ ra log.
    const res = await fetch(`${GEMINI_API_BASE_URL}/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json())?.error?.message || ''; } catch { /* ignore */ }
      const err = new Error(detail || res.statusText);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('');
    if (!rawText) {
      const err = new Error(data?.promptFeedback?.blockReason ? `AI từ chối nội dung (${data.promptFeedback.blockReason})` : 'AI không trả về nội dung');
      err.status = 502;
      throw err;
    }
    try {
      return extractJson(rawText);
    } catch {
      const err = new Error('AI trả về không đúng định dạng JSON');
      err.status = 502;
      throw err;
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function callLlmForJson({ systemPrompt, userPrompt, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!GEMINI_API_KEY) {
    throw new AppError('Chưa cấu hình WRITING_LLM_API_KEY trong Backend/.env để chấm bài bằng AI', 502);
  }

  const failures = []; // { model, status, message, aborted }
  const tried = new Set();

  async function tryModel(model) {
    tried.add(model);
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        return { ok: true, value: await callOnce(model, { systemPrompt, userPrompt, timeoutMs }) };
      } catch (err) {
        const aborted = err.name === 'AbortError';
        console.error(`[LLM] model=${model} lần ${attempt + 1} lỗi: ${aborted ? 'timeout' : `${err.status || ''} ${err.message}`}`);
        const retryable = aborted || err.status === 429 || err.status >= 500;
        if (!retryable || attempt === MAX_RETRIES) {
          failures.push({ model, status: err.status, message: err.message, aborted });
          return { ok: false, fatal: err.status === 401 || err.status === 403 };
        }
        await sleep(800 * (attempt + 1));
      }
    }
    return { ok: false };
  }

  let fatal = false;
  for (const model of STATIC_MODELS) {
    const r = await tryModel(model);
    if (r.ok) return r.value;
    if (r.fatal) { fatal = true; break; } // sai/hết hạn API key: đổi model cũng vô ích
  }

  // Các model cố định đều lỗi -> hỏi Google xem key này dùng được model nào rồi thử tiếp.
  if (!fatal) {
    for (const model of (await discoverModels()).filter((m) => !tried.has(m)).slice(0, 3)) {
      const r = await tryModel(model);
      if (r.ok) return r.value;
      if (r.fatal) break;
    }
  }

  // Báo lỗi có ý nghĩa nhất (không phải lỗi 404 "model không tồn tại" của model dự phòng cuối cùng).
  const rank = (f) => (f.status === 401 || f.status === 403 ? 0 : f.status === 429 ? 1 : f.aborted ? 2 : f.status === 404 ? 4 : 3);
  const best = [...failures].sort((a, b) => rank(a) - rank(b))[0];
  const summary = failures.map((f) => `${f.model}: ${f.aborted ? 'timeout' : f.status || 'lỗi mạng'}`).join('; ');
  let reason;
  if (best.status === 401 || best.status === 403) reason = `API key không hợp lệ hoặc chưa được cấp quyền (mã ${best.status}): ${best.message}`;
  else if (best.status === 429) reason = 'đã hết hạn mức (quota) của API key, hãy đợi hoặc đổi key/bật thanh toán';
  else if (best.aborted) reason = 'quá thời gian chờ phản hồi từ Google';
  else if (!best.status) reason = `không kết nối được tới Google: ${best.message}`;
  else reason = `mã ${best.status}: ${best.message}`;
  throw new AppError(`AI chấm bài thất bại (${reason}). Đã thử: ${summary}`, best.aborted ? 504 : 502);
}

module.exports = { callLlmForJson };
