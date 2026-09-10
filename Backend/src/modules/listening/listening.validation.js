const AppError = require('../../common/utils/AppError');

const VALID_DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function validateListLessonsQuery(req, res, next) {
  const { difficulty, topic } = req.query || {};
  const errors = [];

  if (difficulty !== undefined && !VALID_DIFFICULTIES.includes(difficulty)) {
    errors.push(`difficulty phải là một trong: ${VALID_DIFFICULTIES.join(', ')}`);
  }
  if (topic !== undefined && typeof topic !== 'string') {
    errors.push('topic phải là chuỗi');
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

function validateDictationBody(req, res, next) {
  const { user_text } = req.body || {};

  if (typeof user_text !== 'string' || user_text.trim().length === 0) {
    return next(new AppError('user_text là bắt buộc và phải là chuỗi không rỗng', 400));
  }

  next();
}

module.exports = {
  validateListLessonsQuery,
  validateIdParam,
  validateDictationBody
};
