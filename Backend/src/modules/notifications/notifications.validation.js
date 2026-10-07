const AppError = require('../../common/utils/AppError');

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function validateUpdateSettings(req, res, next) {
  const body = req.body || {};
  const errors = [];

  if (
    body.daily_reminder_time === undefined &&
    body.review_reminder_enabled === undefined &&
    body.push_token === undefined
  ) {
    errors.push('Cần ít nhất một field để cập nhật');
  }

  if (body.daily_reminder_time !== undefined && body.daily_reminder_time !== null) {
    if (typeof body.daily_reminder_time !== 'string' || !TIME_REGEX.test(body.daily_reminder_time)) {
      errors.push('daily_reminder_time phải theo định dạng HH:mm');
    }
  }

  if (body.review_reminder_enabled !== undefined && typeof body.review_reminder_enabled !== 'boolean') {
    errors.push('review_reminder_enabled phải là boolean');
  }

  if (body.push_token !== undefined && body.push_token !== null && typeof body.push_token !== 'string') {
    errors.push('push_token phải là chuỗi');
  }

  if (errors.length > 0) return next(new AppError(errors.join('; '), 400));
  next();
}

function validateListNotificationsQuery(req, res, next) {
  const { is_read } = req.query || {};
  if (is_read !== undefined && !['true', 'false'].includes(is_read)) {
    return next(new AppError('is_read phải là true hoặc false', 400));
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

module.exports = {
  validateUpdateSettings,
  validateListNotificationsQuery,
  validateIdParam
};
