const AppError = require('../../common/utils/AppError');

const SERVICES = ['backend', 'ml-service'];
const ACTION_MAX_LENGTH = 100; // khớp cột audit_logs.action STRING(100)

// YYYY-MM-DD hoặc ISO 8601 (giờ không kèm múi giờ được hiểu là UTC).
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})?$/;

function isValidCalendarDate(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * Trả về Date hợp lệ hoặc null.
 * - 'YYYY-MM-DD'  : `from` -> 00:00:00.000 UTC, `to` -> 23:59:59.999 UTC (bao trọn ngày đó)
 * - ISO 8601 đầy đủ: dùng đúng thời điểm được truyền
 */
function parseDateParam(value, boundary) {
  if (typeof value !== 'string') return null;

  const dateOnly = DATE_ONLY.exec(value);
  if (dateOnly) {
    const [y, m, d] = dateOnly.slice(1).map(Number);
    if (!isValidCalendarDate(y, m, d)) return null;
    return boundary === 'to' ? new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)) : new Date(Date.UTC(y, m - 1, d));
  }

  const dateTime = DATE_TIME.exec(value);
  if (dateTime) {
    const [y, m, d] = dateTime.slice(1, 4).map(Number);
    if (!isValidCalendarDate(y, m, d)) return null;

    const hasZone = Boolean(dateTime[8]);
    const parsed = new Date(hasZone ? value : `${value}Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

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
