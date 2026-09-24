const AppError = require('../../common/utils/AppError');

const CONTENT_TYPES = ['reading_article', 'test_question'];
const REJECT_REASON_MAX_LENGTH = 500; // khớp cột reject_reason STRING(500)

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function validateListPendingQuery(req, res, next) {
  const { type } = req.query || {};

  if (type !== undefined && !CONTENT_TYPES.includes(type)) {
    return next(new AppError(`type phải là một trong: ${CONTENT_TYPES.join(', ')}`, 400));
  }
  next();
}

function validateIdParam(req, res, next) {
  if (!/^\d+$/.test(String(req.params.id)) || !isPositiveInt(req.params.id)) {
    return next(new AppError('id không hợp lệ', 400));
  }
  req.params.id = Number(req.params.id);
  next();
}

function validateRejectBody(req, res, next) {
  const { reject_reason } = req.body || {};

  if (typeof reject_reason !== 'string' || reject_reason.trim().length === 0) {
    return next(new AppError('reject_reason là bắt buộc và không được để trống', 400));
  }

  const trimmed = reject_reason.trim();
  if (trimmed.length > REJECT_REASON_MAX_LENGTH) {
    return next(new AppError(`reject_reason tối đa ${REJECT_REASON_MAX_LENGTH} ký tự`, 400));
  }

  req.body.reject_reason = trimmed;
  next();
}

module.exports = {
  CONTENT_TYPES,
  validateListPendingQuery,
  validateIdParam,
  validateRejectBody
};
