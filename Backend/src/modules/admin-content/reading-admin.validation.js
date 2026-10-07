const AppError = require('../../common/utils/AppError');

const VALID_DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function validateCreateArticle(req, res, next) {
  const body = req.body || {};
  const errors = [];

  if (!body.title || typeof body.title !== 'string') errors.push('title là bắt buộc và phải là chuỗi');
  if (!body.content || typeof body.content !== 'string') errors.push('content là bắt buộc và phải là chuỗi');
  if (body.difficulty !== undefined && body.difficulty !== null && !VALID_DIFFICULTIES.includes(body.difficulty)) {
    errors.push(`difficulty phải là một trong: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  if (errors.length > 0) return next(new AppError(errors.join('; '), 400));
  next();
}

function validateUpdateArticle(req, res, next) {
  const body = req.body || {};
  const allowedFields = ['title', 'content', 'difficulty', 'topic'];

  if (!allowedFields.some((f) => body[f] !== undefined)) {
    return next(new AppError('Cần ít nhất một field để cập nhật', 400));
  }
  if (body.difficulty !== undefined && body.difficulty !== null && !VALID_DIFFICULTIES.includes(body.difficulty)) {
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

module.exports = { validateCreateArticle, validateUpdateArticle, validateIdParam };
