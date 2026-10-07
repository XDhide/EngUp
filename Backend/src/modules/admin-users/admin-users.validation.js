const AppError = require('../../common/utils/AppError');

const VALID_STATUSES = ['active', 'inactive'];

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function validateListUsersQuery(req, res, next) {
  const { search, status, page } = req.query || {};
  const errors = [];

  if (search !== undefined && typeof search !== 'string') errors.push('search phải là chuỗi');
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push(`status phải là một trong: ${VALID_STATUSES.join(', ')}`);
  }
  if (page !== undefined && !isPositiveInt(page)) errors.push('page phải là số nguyên dương');

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

function validateUpdateStatus(req, res, next) {
  const { is_active } = req.body || {};
  if (typeof is_active !== 'boolean') {
    return next(new AppError('is_active phải là boolean', 400));
  }
  next();
}

module.exports = {
  validateListUsersQuery,
  validateIdParam,
  validateUpdateStatus
};
