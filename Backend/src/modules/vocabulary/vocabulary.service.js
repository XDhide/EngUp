const vocabularyRepository = require('./vocabulary.repository');
const { touchActivity } = require('../streaks/streaks.service');
const AppError = require('../../common/utils/AppError');
const {
  toTopicDto,
  toWordDto,
  toWordListItemDto,
  toReviewCardDto
} = require('./vocabulary.dtos');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;
const ML_SERVICE_TIMEOUT_MS = 2500;

async function getTopics() {
  const topics = await vocabularyRepository.findAllTopics();
  return { topics: topics.map(toTopicDto) };
}

async function createTopic(requester, { name, description }) {
  assertAdmin(requester);
  const clean = String(name || '').trim();
  if (await vocabularyRepository.findTopicByName(clean)) {
    throw new AppError('Chủ đề này đã tồn tại', 409);
  }
  const topic = await vocabularyRepository.createTopic({ name: clean, description: description ? String(description).trim() : null });
  return toTopicDto(topic);
}

async function updateTopic(requester, topicId, { name, description }) {
  assertAdmin(requester);
  const topic = await vocabularyRepository.findTopicById(topicId);
  if (!topic) throw new AppError('Chủ đề không tồn tại', 404);
  const fields = {};
  if (name !== undefined) {
    const clean = String(name).trim();
    const dup = await vocabularyRepository.findTopicByName(clean);
    if (dup && Number(dup.id) !== Number(topic.id)) throw new AppError('Chủ đề này đã tồn tại', 409);
    fields.name = clean;
  }
  if (description !== undefined) fields.description = description ? String(description).trim() : null;
  return toTopicDto(await vocabularyRepository.updateTopic(topic, fields));
}

async function deleteTopic(requester, topicId) {
  assertAdmin(requester);
  const topic = await vocabularyRepository.findTopicById(topicId);
  if (!topic) throw new AppError('Chủ đề không tồn tại', 404);
  await vocabularyRepository.deleteTopic(topic);
  return null;
}

async function getWords({ topic_id, difficulty, limit, offset, includePending = false }) {
  const parsedLimit = limit ? Number(limit) : 20;
  const parsedOffset = offset ? Number(offset) : 0;

  const { words, total } = await vocabularyRepository.findWords({
    topic_id: topic_id ? Number(topic_id) : undefined,
    difficulty,
    limit: parsedLimit,
    offset: parsedOffset,
    includePending
  });

  return { words: words.map(toWordListItemDto), total };
}

function assertAdmin(requester) {
  if (!requester || requester.role !== 'admin') {
    throw new AppError('Chỉ admin mới có quyền thao tác từ vựng', 403);
  }
}

async function createWord(requester, data) {
  assertAdmin(requester);
  const word = await vocabularyRepository.createWord({ ...data, is_approved: true, created_by: requester.id });
  return toWordDto(word);
}

const BULK_MAX = 300;
const AI_BATCH = 25;
const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Nhờ AI điền phiên âm, nghĩa tiếng Việt, câu ví dụ, cấp độ CEFR cho danh sách từ tiếng Anh.
async function enrichWordsWithAi(rawWords) {
  const { callLlmForJson } = require('../../common/services/llmGradingService');
  const result = new Map();
  for (let i = 0; i < rawWords.length; i += AI_BATCH) {
    const chunk = rawWords.slice(i, i + AI_BATCH);
    const out = await callLlmForJson({
      systemPrompt:
        'Bạn là giảng viên từ vựng tiếng Anh. Với mỗi từ được cho, trả về JSON dạng ' +
        '{"words":[{"word":"...","phonetic":"/IPA/","meaning":"nghĩa tiếng Việt ngắn gọn","example_sentence":"một câu ví dụ tiếng Anh","difficulty":"A1|A2|B1|B2|C1|C2"}]}. ' +
        'Giữ nguyên chính tả của từ gốc. Chỉ trả về JSON.',
      userPrompt: JSON.stringify(chunk),
      timeoutMs: 40000
    });
    for (const w of out?.words || []) {
      if (w && typeof w.word === 'string') result.set(w.word.trim().toLowerCase(), w);
    }
  }
  return result;
}

async function bulkCreateWords(requester, { items, topic_id, difficulty, ai_enrich }) {
  assertAdmin(requester);
  if (!Array.isArray(items) || items.length === 0) throw new AppError('Danh sách từ trống', 400);
  if (items.length > BULK_MAX) throw new AppError(`Mỗi lần chỉ nhập tối đa ${BULK_MAX} từ`, 400);

  // 1. Chuẩn hoá + bỏ trùng trong chính danh sách gửi lên
  const seen = new Set();
  const cleaned = [];
  const skipped = [];
  for (const it of items) {
    const word = String(it?.word || '').trim();
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) { skipped.push({ word, reason: 'Trùng trong danh sách nhập' }); continue; }
    seen.add(key);
    cleaned.push({
      word,
      meaning: String(it.meaning || '').trim(),
      phonetic: String(it.phonetic || '').trim(),
      example_sentence: String(it.example_sentence || '').trim(),
      difficulty: String(it.difficulty || '').trim().toUpperCase()
    });
  }

  // 2. Bỏ những từ đã có trong DB
  const existing = await vocabularyRepository.findExistingWordTexts(cleaned.map((c) => c.word));
  const todo = cleaned.filter((c) => {
    if (existing.has(c.word.toLowerCase())) { skipped.push({ word: c.word, reason: 'Từ đã tồn tại' }); return false; }
    return true;
  });

  // 3. AI điền phần còn thiếu
  let aiError = null;
  if (ai_enrich) {
    const needAi = todo.filter((c) => !c.meaning || !c.phonetic || !c.example_sentence || !c.difficulty);
    if (needAi.length) {
      try {
        const enriched = await enrichWordsWithAi(needAi.map((c) => c.word));
        for (const c of needAi) {
          const e = enriched.get(c.word.toLowerCase());
          if (!e) continue;
          c.meaning = c.meaning || String(e.meaning || '').trim();
          c.phonetic = c.phonetic || String(e.phonetic || '').trim();
          c.example_sentence = c.example_sentence || String(e.example_sentence || '').trim();
          c.difficulty = c.difficulty || String(e.difficulty || '').trim().toUpperCase();
        }
      } catch (err) {
        aiError = err.message || 'AI không phản hồi';
      }
    }
  }

  // 4. Lưu
  const toInsert = [];
  const failed = [];
  for (const c of todo) {
    if (!c.meaning) { failed.push({ word: c.word, reason: aiError ? `Thiếu nghĩa (AI lỗi: ${aiError})` : 'Thiếu nghĩa' }); continue; }
    const level = VALID_LEVELS.includes(c.difficulty) ? c.difficulty : (VALID_LEVELS.includes(difficulty) ? difficulty : null);
    toInsert.push({
      word: c.word.slice(0, 150),
      meaning: c.meaning.slice(0, 500),
      phonetic: c.phonetic ? c.phonetic.slice(0, 150) : null,
      example_sentence: c.example_sentence || null,
      difficulty: level,
      topic_id: topic_id || null,
      is_approved: true,
      created_by: requester.id
    });
  }
  if (toInsert.length) await vocabularyRepository.bulkCreateWords(toInsert);

  return { created: toInsert.length, skipped, failed, ai_error: aiError };
}

async function updateWord(requester, wordId, fieldsToUpdate) {
  assertAdmin(requester);
  const word = await vocabularyRepository.findWordById(wordId);
  if (!word) {
    throw new AppError('Từ vựng không tồn tại', 404);
  }
  const updated = await vocabularyRepository.updateWord(word, fieldsToUpdate);
  return toWordDto(updated);
}

async function deleteWord(requester, wordId) {
  assertAdmin(requester);
  const word = await vocabularyRepository.findWordById(wordId);
  if (!word) {
    throw new AppError('Từ vựng không tồn tại', 404);
  }
  await vocabularyRepository.deleteWord(word);
  return null;
}

async function getNewWords(userId, limitQuery) {
  const user = await vocabularyRepository.findUserById(userId);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  const limit = limitQuery ? Math.min(Number(limitQuery), user.daily_new_word_limit) : user.daily_new_word_limit;

  const [words, learnedToday] = await Promise.all([
    vocabularyRepository.findNewWordsForUser(userId, limit),
    vocabularyRepository.countCardsCreatedToday(userId)
  ]);
  return {
    words: words.map(toWordListItemDto),
    daily_limit: user.daily_new_word_limit,
    learned_today: learnedToday
  };
}

async function updateDailyNewWordLimit(userId, limit) {
  const user = await vocabularyRepository.updateDailyNewWordLimit(userId, limit);
  return { daily_new_word_limit: user.daily_new_word_limit };
}

function computeSm2Update({ ease_factor, interval_days, repetitions }, result) {
  let newEase = Number(ease_factor);
  let newInterval = Number(interval_days);
  let newRepetitions = Number(repetitions);

  switch (result) {
    case 'again':
      newRepetitions = 0;
      newInterval = 0;
      newEase = Math.max(1.3, newEase - 0.2);
      break;
    case 'hard':
      newInterval = Math.max(1, Math.round((newInterval || 1) * 1.2));
      newEase = Math.max(1.3, newEase - 0.15);
      newRepetitions += 1;
      break;
    case 'good':
      if (newRepetitions === 0) newInterval = 1;
      else if (newRepetitions === 1) newInterval = 6;
      else newInterval = Math.round(newInterval * newEase);
      newRepetitions += 1;
      break;
    case 'easy':
      newInterval = Math.round((newInterval || 1) * newEase * 1.3);
      newEase = newEase + 0.15;
      newRepetitions += 1;
      break;
    default:
      throw new AppError('result không hợp lệ', 400);
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    ease_factor: newEase,
    interval_days: newInterval,
    repetitions: newRepetitions,
    next_review_at: nextReviewAt,
    recall_probability: null
  };
}

async function tryPredict(card) {
  if (!ML_SERVICE_URL) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_SERVICE_TIMEOUT_MS);

  try {
    const res = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: card.user_id, word_id: card.word_id }),
      signal: controller.signal
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.recall_probability !== 'number') return null;
    return data;
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function getTodayReviewCards(userId) {
  const cards = await vocabularyRepository.findCardsDueToday(userId);

  const enriched = await Promise.all(
    cards.map(async (card) => {
      const prediction = await tryPredict(card);
      if (prediction) {
        return { ...card.toJSON(), recall_probability: prediction.recall_probability };
      }
      return card.toJSON();
    })
  );

  return { cards: enriched.map((c) => toReviewCardDto({ ...c, word: c.word })) };
}

async function submitReview(userId, { card_id, result, response_time_ms }) {
  const card = await vocabularyRepository.findCardById(card_id);
  if (!card || card.user_id !== userId) {
    throw new AppError('Card không tồn tại', 404);
  }

  const update = computeSm2Update(card, result);
  const updatedCard = await vocabularyRepository.updateCardAfterReview(card, update);

  await vocabularyRepository.createReviewLog({
    card_id: card.id,
    user_id: userId,
    word_id: card.word_id,
    result,
    response_time_ms
  });
  touchActivity(userId);

  return {
    next_review_at: updatedCard.next_review_at,
    interval_days: updatedCard.interval_days
  };
}

module.exports = {
  getTopics,
  getWords,
  createTopic,
  updateTopic,
  deleteTopic,
  createWord,
  bulkCreateWords,
  updateWord,
  deleteWord,
  getNewWords,
  updateDailyNewWordLimit,
  getTodayReviewCards,
  submitReview,

  computeSm2Update
};
