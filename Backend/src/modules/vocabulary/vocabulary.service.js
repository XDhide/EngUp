const vocabularyRepository = require('./vocabulary.repository');
const AppError = require('../../common/utils/AppError');
const {
  toTopicDto,
  toWordDto,
  toWordListItemDto,
  toReviewCardDto
} = require('./vocabulary.dtos');

// Giả định biến môi trường ML_SERVICE_URL trỏ tới ML-Service (vd http://localhost:6000).
// Nếu chưa có ML-Service chạy thật, biến này để trống -> code tự fallback SM-2, không lỗi.
const ML_SERVICE_URL = process.env.ML_SERVICE_URL;
const ML_SERVICE_TIMEOUT_MS = 2500;

// ============================================================
// Topics & Words
// ============================================================

async function getTopics() {
  const topics = await vocabularyRepository.findAllTopics();
  return { topics: topics.map(toTopicDto) };
}

async function createTopic(requester, data) {
  assertAdmin(requester);
  const topic = await vocabularyRepository.createTopic(data);
  return toTopicDto(topic);
}

async function updateTopic(requester, topicId, fieldsToUpdate) {
  assertAdmin(requester);
  const topic = await vocabularyRepository.findTopicById(topicId);
  if (!topic) {
    throw new AppError('Chủ đề không tồn tại', 404);
  }
  const updated = await vocabularyRepository.updateTopic(topic, fieldsToUpdate);
  return toTopicDto(updated);
}

async function deleteTopic(requester, topicId) {
  assertAdmin(requester);
  const topic = await vocabularyRepository.findTopicById(topicId);
  if (!topic) {
    throw new AppError('Chủ đề không tồn tại', 404);
  }
  await vocabularyRepository.deleteTopic(topic);
  return null;
}

async function getWords({ topic_id, difficulty, limit, offset }) {
  const parsedLimit = limit ? Number(limit) : 20;
  const parsedOffset = offset ? Number(offset) : 0;

  const { words, total } = await vocabularyRepository.findWords({
    topic_id: topic_id ? Number(topic_id) : undefined,
    difficulty,
    limit: parsedLimit,
    offset: parsedOffset
  });

  return { words: words.map(toWordListItemDto), total };
}

// ---- Admin CRUD ----
// requester = req.user (đã qua authenticateJWT). Kiểm role ngay đây vì chưa rõ
// đồng đội có middleware requireRole riêng hay không — dễ thay bằng middleware sau.

function assertAdmin(requester) {
  if (!requester || requester.role !== 'admin') {
    throw new AppError('Chỉ admin mới có quyền thao tác từ vựng', 403);
  }
}

async function createWord(requester, data) {
  assertAdmin(requester);
  const word = await vocabularyRepository.createWord(data);
  return toWordDto(word);
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

// ============================================================
// New words trong ngày (giới hạn theo users.daily_new_word_limit)
// ============================================================

async function getNewWords(userId, limitQuery) {
  const user = await vocabularyRepository.findUserById(userId);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  const limit = limitQuery ? Math.min(Number(limitQuery), user.daily_new_word_limit) : user.daily_new_word_limit;

  const words = await vocabularyRepository.findNewWordsForUser(userId, limit);
  return { words: words.map(toWordListItemDto) };
}

async function updateDailyNewWordLimit(userId, limit) {
  const user = await vocabularyRepository.updateDailyNewWordLimit(userId, limit);
  return { daily_new_word_limit: user.daily_new_word_limit };
}

// ============================================================
// SM-2 fallback (khi ML-Service lỗi/timeout/chưa tồn tại)
// Ánh xạ 4 nút Anki-style (again/hard/good/easy) sang cập nhật ease_factor,
// interval_days, repetitions — quy ước riêng cho EngUp, không phải SM-2 gốc 0-5.
// ============================================================

function computeSm2Update({ ease_factor, interval_days, repetitions }, result) {
  let newEase = Number(ease_factor);
  let newInterval = Number(interval_days);
  let newRepetitions = Number(repetitions);

  switch (result) {
    case 'again':
      newRepetitions = 0;
      newInterval = 0; // ôn lại trong ngày / phiên tiếp theo
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
    recall_probability: null // SM-2 fallback không tính recall_probability
  };
}

// Gọi ML-Service /predict cho 1 card; trả null nếu lỗi/timeout/chưa cấu hình URL
// -> caller tự fallback SM-2, KHÔNG được để lỗi này chặn response của /review/today.
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
    // Kỳ vọng { recall_probability, next_review_at }
    if (typeof data.recall_probability !== 'number') return null;
    return data;
  } catch (err) {
    return null; // timeout hoặc lỗi mạng -> fallback
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// Review today / submit
// ============================================================

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

  return {
    next_review_at: updatedCard.next_review_at,
    interval_days: updatedCard.interval_days
  };
}

module.exports = {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getWords,
  createWord,
  updateWord,
  deleteWord,
  getNewWords,
  updateDailyNewWordLimit,
  getTodayReviewCards,
  submitReview,
  // export để viết unit test riêng cho thuật toán, không phụ thuộc DB
  computeSm2Update
};
