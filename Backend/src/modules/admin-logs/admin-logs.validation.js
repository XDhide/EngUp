const AppError = require('../../common/utils/AppError');
const { parseDateParam } = require('../../common/utils/dateParam');

const SERVICES = ['backend', 'ml-service'];
const ACTION_MAX_LENGTH = 100; // khớp cột audit_logs.action STRING(100)

function isPositiveInt(value) {
  return typeof value === 'string' && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

// GET /errors?service=backend|ml-service&from=&to=
// Sau khi hợp lệ, bộ lọc đã chuẩn hoá được gắn vào req.filters (Date thay vì chuỗi).
function validateErrorLogsQuery(req, res, next) {
  const { service, from, to } = req.query || {};
  const filters = {};

  if (service !== undefined) {
    if (!SERVICES.includes(service)) {
      return next(new AppError(`service phải là một trong: ${SERVICES.join(', ')}`, 400));
    }
    filters.service = service;
  }

  if (from !== undefined) {
    filters.from = parseDateParam(from, 'from');
    if (!filters.from) return next(new AppError('from không hợp lệ (dùng YYYY-MM-DD hoặc ISO 8601)', 400));
  }

  if (to !== undefined) {
    filters.to = parseDateParam(to, 'to');
    if (!filters.to) return next(new AppError('to không hợp lệ (dùng YYYY-MM-DD hoặc ISO 8601)', 400));
  }

  if (filters.from && filters.to && filters.from > filters.to) {
    return next(new AppError('from không được lớn hơn to', 400));
  }

  req.filters = filters;
  next();
}

// GET /audit?actor_id=&action=
function validateAuditLogsQuery(req, res, next) {
  const { actor_id, action } = req.query || {};
  const filters = {};

  if (actor_id !== undefined) {
    if (!isPositiveInt(actor_id)) return next(new AppError('actor_id phải là số nguyên dương', 400));
    filters.actor_id = Number(actor_id);
  }

  if (action !== undefined) {
    if (typeof action !== 'string' || action.trim().length === 0) {
      return next(new AppError('action phải là chuỗi không rỗng', 400));
    }
    const trimmed = action.trim();
    if (trimmed.length > ACTION_MAX_LENGTH) {
      return next(new AppError(`action tối đa ${ACTION_MAX_LENGTH} ký tự`, 400));
    }
    filters.action = trimmed;
  }

  req.filters = filters;
  next();
}

module.exports = {
  SERVICES,
  ACTION_MAX_LENGTH,
  parseDateParam,
  validateErrorLogsQuery,
  validateAuditLogsQuery
};
