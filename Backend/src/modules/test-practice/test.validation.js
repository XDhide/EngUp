const AppError = require('../../common/utils/AppError');

const VALID_EXAM_TYPES = ['IELTS', 'TOEIC'];

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function validateListTestSetsQuery(req, res, next) {
  const { exam_type } = req.query || {};
  if (exam_type !== undefined && !VALID_EXAM_TYPES.includes(exam_type)) {
    return next(new AppError(`exam_type phải là một trong: ${VALID_EXAM_TYPES.join(', ')}`, 400));
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

function validateSubmitAttempt(req, res, next) {
  const { attempt_id, answers } = req.body || {};
  const errors = [];

  if (!isPositiveInt(attempt_id)) errors.push('attempt_id phải là số nguyên dương');
  if (!Array.isArray(answers) || answers.length === 0) {
    errors.push('answers phải là mảng không rỗng');
  } else {
    answers.forEach((a, idx) => {
      if (!a || !isPositiveInt(a.question_id)) errors.push(`answers[${idx}].question_id phải là số nguyên dương`);
    });
  }

  if (errors.length > 0) return next(new AppError(errors.join('; '), 400));
  next();
}

function validateSubmitWriting(req, res, next) {
  const { attempt_id, content } = req.body || {};
  const errors = [];

  if (!isPositiveInt(attempt_id)) errors.push('attempt_id phải là số nguyên dương');
  if (!content || typeof content !== 'string') errors.push('content phải là chuỗi không rỗng');

  if (errors.length > 0) return next(new AppError(errors.join('; '), 400));
  next();
}

function validateListAttemptsQuery(req, res, next) {
  const { limit, offset } = req.query || {};
  const errors = [];

  if (limit !== undefined && !isPositiveInt(limit)) errors.push('limit phải là số nguyên dương');
  if (offset !== undefined && (!Number.isInteger(Number(offset)) || Number(offset) < 0)) {
    errors.push('offset phải là số nguyên >= 0');
  }

  if (errors.length > 0) return next(new AppError(errors.join('; '), 400));
  next();
}

module.exports = {
  validateListTestSetsQuery,
  validateIdParam,
  validateSubmitAttempt,
  validateSubmitWriting,
  validateListAttemptsQuery
};
