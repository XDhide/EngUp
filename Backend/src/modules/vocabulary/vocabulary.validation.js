const AppError = require('../../common/utils/AppError');

const VALID_DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const VALID_RESULTS = ['again', 'hard', 'good', 'easy'];

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function validateListWordsQuery(req, res, next) {
  const { topic_id, difficulty, limit, offset } = req.query || {};
  const errors = [];

  if (topic_id !== undefined && !isPositiveInt(topic_id)) errors.push('topic_id phải là số nguyên dương');
  if (difficulty !== undefined && !VALID_DIFFICULTIES.includes(difficulty)) {
    errors.push(`difficulty phải là một trong: ${VALID_DIFFICULTIES.join(', ')}`);
  }
  if (limit !== undefined && !isPositiveInt(limit)) errors.push('limit phải là số nguyên dương');
  if (offset !== undefined && (!Number.isInteger(Number(offset)) || Number(offset) < 0)) {
    errors.push('offset phải là số nguyên >= 0');
  }

  if (errors.length > 0) return next(new AppError(errors.join('; '), 400));
  next();
}

function validateCreateWord(req, res, next) {
  const body = req.body || {};
  const errors = [];

  if (!body.word || typeof body.word !== 'string') errors.push('word là bắt buộc và phải là chuỗi');
  if (!body.meaning || typeof body.meaning !== 'string') errors.push('meaning là bắt buộc và phải là chuỗi');
  if (body.topic_id !== undefined && body.topic_id !== null && !isPositiveInt(body.topic_id)) {
    errors.push('topic_id phải là số nguyên dương');
  }
  if (body.difficulty !== undefined && body.difficulty !== null && !VALID_DIFFICULTIES.includes(body.difficulty)) {
    errors.push(`difficulty phải là một trong: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  if (errors.length > 0) return next(new AppError(errors.join('; '), 400));
  next();
}

function validateUpdateWord(req, res, next) {
  const body = req.body || {};
  const allowedFields = ['topic_id', 'word', 'phonetic', 'meaning', 'example_sentence', 'audio_url', 'difficulty'];
  const errors = [];

  if (!allowedFields.some((f) => body[f] !== undefined)) {
    errors.push('Cần ít nhất một field để cập nhật');
  }
  if (body.topic_id !== undefined && body.topic_id !== null && !isPositiveInt(body.topic_id)) {
    errors.push('topic_id phải là số nguyên dương');
  }
  if (body.difficulty !== undefined && body.difficulty !== null && !VALID_DIFFICULTIES.includes(body.difficulty)) {
    errors.push(`difficulty phải là một trong: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  if (errors.length > 0) return next(new AppError(errors.join('; '), 400));
  next();
}

function validateIdParam(req, res, next) {
  if (!isPositiveInt(req.params.id)) {
    return next(new AppError('id không hợp lệ', 400));
  }
  req.params.id = Number(req.params.id);
  next();
}

function validateNewWordsQuery(req, res, next) {
  const { limit } = req.query || {};
  if (limit !== undefined && !isPositiveInt(limit)) {
    return next(new AppError('limit phải là số nguyên dương', 400));
  }
  next();
}

function validateDailyNewWordLimit(req, res, next) {
  const { limit } = req.body || {};
  if (!isPositiveInt(limit)) {
    return next(new AppError('limit phải là số nguyên dương', 400));
  }
  next();
}

function validateSubmitReview(req, res, next) {
  const { card_id, result, response_time_ms } = req.body || {};
  const errors = [];

  if (!isPositiveInt(card_id)) errors.push('card_id phải là số nguyên dương');
  if (!VALID_RESULTS.includes(result)) errors.push(`result phải là một trong: ${VALID_RESULTS.join(', ')}`);
  if (response_time_ms !== undefined && response_time_ms !== null) {
    if (!Number.isInteger(Number(response_time_ms)) || Number(response_time_ms) < 0) {
      errors.push('response_time_ms phải là số nguyên >= 0');
    }
  }

  if (errors.length > 0) return next(new AppError(errors.join('; '), 400));
  next();
}

module.exports = {
  validateListWordsQuery,
  validateCreateWord,
  validateUpdateWord,
  validateIdParam,
  validateNewWordsQuery,
  validateDailyNewWordLimit,
  validateSubmitReview
};