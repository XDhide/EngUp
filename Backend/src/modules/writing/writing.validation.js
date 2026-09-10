const AppError = require('../../common/utils/AppError');

const VALID_TYPES = ['free', 'ielts', 'toeic'];

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function validateListPromptsQuery(req, res, next) {
  const { type } = req.query || {};

  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return next(new AppError(`type phải là một trong: ${VALID_TYPES.join(', ')}`, 400));
  }

  next();
}

function validateCreateSubmission(req, res, next) {
  const body = req.body || {};
  const errors = [];

  if (!isPositiveInt(body.prompt_id)) errors.push('prompt_id phải là số nguyên dương');
  if (typeof body.content !== 'string' || body.content.trim().length === 0) {
    errors.push('content là bắt buộc và phải là chuỗi không rỗng');
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

function validateListSubmissionsQuery(req, res, next) {
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
  validateListPromptsQuery,
  validateCreateSubmission,
  validateIdParam,
  validateListSubmissionsQuery
};
