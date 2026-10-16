const repo = require('./results.repository');
const AppError = require('../../common/utils/AppError');

const num = (v) => (v === null || v === undefined ? null : Number(v));
const userOf = (a) => ({
  user_id: a.user_id,
  user_name: a.user ? a.user.full_name : null,
  user_email: a.user ? a.user.email : null
});

// ---------- Học viên ----------
async function myReading(userId, opts) {
  const rows = await repo.findReadingAttemptsOfUser(userId, opts);
  return {
    attempts: rows.map((a) => ({
      id: a.id,
      article_id: a.article_id,
      title: a.article ? a.article.title : null,
      difficulty: a.article ? a.article.difficulty : null,
      score: num(a.score),
      correct_count: a.correct_count,
      total_count: a.total_count,
      submitted_at: a.submitted_at
    }))
  };
}

async function myListening(userId, opts) {
  const rows = await repo.findListeningAttemptsOfUser(userId, opts);
  return {
    attempts: rows.map((a) => ({
      id: a.id,
      lesson_id: a.lesson_id,
      title: a.lesson ? a.lesson.title : null,
      difficulty: a.lesson ? a.lesson.difficulty : null,
      accuracy_percent: num(a.accuracy_percent),
      wrong_count: Array.isArray(a.wrong_words) ? a.wrong_words.length : 0,
      submitted_at: a.submitted_at
    }))
  };
}

// ---------- Admin ----------
async function adminTests({ test_set_id, limit, offset }) {
  const rows = await repo.findTestAttempts(test_set_id, { limit, offset });
  return {
    attempts: rows.map((a) => ({
      id: a.id,
      ...userOf(a),
      test_set_id: a.test_set_id,
      title: a.testSet ? a.testSet.title : null,
      score: num(a.score),
      band_score: num(a.band_score),
      status: a.status,
      started_at: a.started_at,
      submitted_at: a.submitted_at
    }))
  };
}

async function adminReading({ article_id, limit, offset }) {
  const rows = await repo.findReadingAttempts(article_id, { limit, offset });
  return {
    attempts: rows.map((a) => ({
      id: a.id,
      ...userOf(a),
      item_id: a.article_id,
      title: a.article ? a.article.title : null,
      score: num(a.score),
      correct_count: a.correct_count,
      total_count: a.total_count,
      submitted_at: a.submitted_at
    }))
  };
}

async function adminListening({ lesson_id, limit, offset }) {
  const rows = await repo.findListeningAttempts(lesson_id, { limit, offset });
  return {
    attempts: rows.map((a) => ({
      id: a.id,
      ...userOf(a),
      item_id: a.lesson_id,
      title: a.lesson ? a.lesson.title : null,
      accuracy_percent: num(a.accuracy_percent),
      wrong_count: Array.isArray(a.wrong_words) ? a.wrong_words.length : 0,
      submitted_at: a.submitted_at
    }))
  };
}

async function adminWriting({ prompt_id, limit, offset }) {
  const rows = await repo.findWritingSubmissions(prompt_id, { limit, offset });
  return {
    attempts: rows.map((a) => ({
      id: a.id,
      ...userOf(a),
      item_id: a.prompt_id,
      title: a.prompt ? a.prompt.title : null,
      ai_score: num(a.ai_score),
      content: a.content,
      ai_feedback: a.ai_feedback,
      submitted_at: a.created_at
    }))
  };
}

// ---------- Đề bài viết ----------
const PROMPT_TYPES = ['free', 'ielts', 'toeic'];
const DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function cleanPrompt(body, partial) {
  const out = {};
  const b = body || {};
  if (!partial || b.title !== undefined) {
    if (!b.title || typeof b.title !== 'string' || !b.title.trim()) throw new AppError('title là bắt buộc', 400);
    out.title = b.title.trim().slice(0, 255);
  }
  if (!partial || b.prompt_text !== undefined) {
    if (!b.prompt_text || typeof b.prompt_text !== 'string' || !b.prompt_text.trim()) throw new AppError('prompt_text là bắt buộc', 400);
    out.prompt_text = b.prompt_text.trim();
  }
  if (b.type !== undefined) {
    if (!PROMPT_TYPES.includes(b.type)) throw new AppError(`type phải là một trong: ${PROMPT_TYPES.join(', ')}`, 400);
    out.type = b.type;
  }
  if (b.difficulty !== undefined) {
    if (b.difficulty !== null && b.difficulty !== '' && !DIFFICULTIES.includes(b.difficulty)) {
      throw new AppError(`difficulty phải là một trong: ${DIFFICULTIES.join(', ')}`, 400);
    }
    out.difficulty = b.difficulty || null;
  }
  return out;
}

const promptDto = (p) => ({
  id: p.id, title: p.title, prompt_text: p.prompt_text, type: p.type, difficulty: p.difficulty, created_at: p.created_at
});

async function listPrompts() {
  return { prompts: (await repo.findAllPrompts()).map(promptDto) };
}
async function createPrompt(body) {
  return promptDto(await repo.createPrompt(cleanPrompt(body, false)));
}
async function updatePrompt(id, body) {
  const prompt = await repo.findPromptById(id);
  if (!prompt) throw new AppError('Đề bài không tồn tại', 404);
  const patch = cleanPrompt(body, true);
  if (!Object.keys(patch).length) throw new AppError('Cần ít nhất một field để cập nhật', 400);
  return promptDto(await repo.updatePrompt(prompt, patch));
}
async function deletePrompt(id) {
  const prompt = await repo.findPromptById(id);
  if (!prompt) throw new AppError('Đề bài không tồn tại', 404);
  await repo.deletePrompt(prompt);
  return null;
}

module.exports = {
  myReading, myListening,
  adminTests, adminReading, adminListening, adminWriting,
  listPrompts, createPrompt, updatePrompt, deletePrompt
};
