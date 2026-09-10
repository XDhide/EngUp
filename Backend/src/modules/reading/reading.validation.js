const AppError = require('../../common/utils/AppError');

const VALID_DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function validateListArticlesQuery(req, res, next) {
  const { difficulty } = req.query || {};
  if (difficulty !== undefined && !VALID_DIFFICULTIES.includes(difficulty)) {
    return next(new AppError(`difficulty phải là một trong: ${VALID_DIFFICULTIES.join(', ')}`, 400));
  }
  next();
}

function validateIdParam(req, res, next) {
  if (!isPositiveInt(req.params.id)) {
    return next(new AppError('id không hợp lệ', 400));
  }
  req.params.id = Number(req.params.id);
  next();
}

function validateSubmitAnswers(req, res, next) {
  const { answers } = req.body || {};
  const errors = [];

  if (!Array.isArray(answers) || answers.length === 0) {
    errors.push('answers phải là mảng không rỗng');
  } else {
    answers.forEach((a, idx) => {
      if (!a || !isPositiveInt(a.question_id)) {
        errors.push(`answers[${idx}].question_id phải là số nguyên dương`);
      }
      if (!a || typeof a.answer !== 'string' || !a.answer) {
        errors.push(`answers[${idx}].answer phải là chuỗi không rỗng`);
      }
    });
  }

  if (errors.length > 0) return next(new AppError(errors.join('; '), 400));
  next();
}

function validateGenerateArticle(req, res, next) {
  const { topic, difficulty } = req.body || {};
  const errors = [];

  if (!topic || typeof topic !== 'string') errors.push('topic là bắt buộc và phải là chuỗi');
  if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
    errors.push(`difficulty là bắt buộc, phải là một trong: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  if (errors.length > 0) return next(new AppError(errors.join('; '), 400));
  next();
}

module.exports = {
  validateListArticlesQuery,
  validateIdParam,
  validateSubmitAnswers,
  validateGenerateArticle
};