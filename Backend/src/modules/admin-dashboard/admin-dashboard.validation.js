const AppError = require('../../common/utils/AppError');
const { parseDateParam } = require('../../common/utils/dateParam');

const SUBSCRIPTION_STATUSES = ['active', 'expired', 'cancelled'];

const MAX_UINT = 4294967295; // INTEGER UNSIGNED
const MAX_PRICE = 99999999.99; // DECIMAL(10, 2)
const MAX_FEATURES_LENGTH = 10000; // độ dài JSON.stringify(features)
const TYPE_PATTERN = /^[a-z0-9_]+$/; // khoá loại thông báo, vd: review_due, daily_reminder, system

function isNonEmptyString(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isIntInRange(value, min, max) {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isPositiveIntString(value) {
  return typeof value === 'string' && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Mỗi rule trả về chuỗi lỗi hoặc null. Rule nhận giá trị đã có mặt (khác undefined).
const TEMPLATE_RULES = {
  name: (v) => (isNonEmptyString(v, 100) ? null : 'name phải là chuỗi không rỗng, tối đa 100 ký tự'),
  title_template: (v) =>
    isNonEmptyString(v, 255) ? null : 'title_template phải là chuỗi không rỗng, tối đa 255 ký tự',
  body_template: (v) =>
    isNonEmptyString(v, 5000) ? null : 'body_template phải là chuỗi không rỗng, tối đa 5000 ký tự',
  type: (v) =>
    isNonEmptyString(v, 50) && TYPE_PATTERN.test(v.trim())
      ? null
      : 'type phải là chuỗi tối đa 50 ký tự, chỉ gồm chữ thường, số và dấu gạch dưới (vd: review_due)'
};

const PLAN_RULES = {
  name: (v) => (isNonEmptyString(v, 100) ? null : 'name phải là chuỗi không rỗng, tối đa 100 ký tự'),
  price: (v) => {
    const ok =
      typeof v === 'number' &&
      Number.isFinite(v) &&
      v >= 0 &&
      v <= MAX_PRICE &&
      Math.abs(v * 100 - Math.round(v * 100)) < 1e-6; // tối đa 2 chữ số thập phân
    return ok ? null : `price phải là số từ 0 đến ${MAX_PRICE}, tối đa 2 chữ số thập phân`;
  },
  duration_days: (v) =>
    isIntInRange(v, 1, MAX_UINT) ? null : 'duration_days phải là số nguyên dương',
  features: (v) => {
    if (v === null) return null;
    if (!Array.isArray(v) && !isPlainObject(v)) return 'features phải là mảng, object hoặc null';
    return JSON.stringify(v).length <= MAX_FEATURES_LENGTH
      ? null
      : `features quá lớn (tối đa ${MAX_FEATURES_LENGTH} ký tự JSON)`;
  }
};

// Chuẩn hoá: trim các chuỗi.
function normalize(body, field) {
  if (typeof body[field] === 'string') body[field] = body[field].trim();
}

/**
 * @param {object} body
 * @param {object} rules
 * @param {string[]} requiredFields  field bắt buộc phải có (dùng cho POST)
 * @param {boolean} requireAny       PUT: phải gửi ít nhất một field hợp lệ
 */
function runRules(body, rules, requiredFields, requireAny) {
  const errors = [];
  const fields = Object.keys(rules);

  requiredFields.forEach((field) => {
    if (body[field] === undefined) errors.push(`${field} là bắt buộc`);
  });

  fields.forEach((field) => {
    if (body[field] === undefined) return;
    const error = rules[field](body[field]);
    if (error) errors.push(error);
    else normalize(body, field);
  });

  if (requireAny && !fields.some((field) => body[field] !== undefined)) {
    errors.push(`Cần gửi ít nhất một trong các field: ${fields.join(', ')}`);
  }
  return errors;
}

function respond(errors, next) {
  if (errors.length > 0) return next(new AppError(errors.join('; '), 400));
  return next();
}

function validateIdParam(req, res, next) {
  if (!isPositiveIntString(String(req.params.id))) {
    return next(new AppError('id không hợp lệ', 400));
  }
  req.params.id = Number(req.params.id);
  next();
}

// ---------- Mẫu thông báo ----------

function validateCreateTemplate(req, res, next) {
  req.body = req.body || {};
  respond(runRules(req.body, TEMPLATE_RULES, Object.keys(TEMPLATE_RULES), false), next);
}

function validateUpdateTemplate(req, res, next) {
  req.body = req.body || {};
  respond(runRules(req.body, TEMPLATE_RULES, [], true), next);
}

// GET /sent-history?from=&to=  -> bộ lọc đã chuẩn hoá được gắn vào req.filters (Date)
function validateSentHistoryQuery(req, res, next) {
  const { from, to } = req.query || {};
  const filters = {};

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

// ---------- Gói cước ----------

function validateCreatePlan(req, res, next) {
  req.body = req.body || {};
  const required = ['name', 'price', 'duration_days'];
  respond(runRules(req.body, PLAN_RULES, required, false), next);
}

function validateUpdatePlan(req, res, next) {
  req.body = req.body || {};
  respond(runRules(req.body, PLAN_RULES, [], true), next);
}

// GET /subscriptions?user_id=&status=  -> bộ lọc đã chuẩn hoá được gắn vào req.filters
function validateSubscriptionsQuery(req, res, next) {
  const { user_id, status } = req.query || {};
  const filters = {};

  if (user_id !== undefined) {
    if (!isPositiveIntString(user_id)) return next(new AppError('user_id phải là số nguyên dương', 400));
    filters.user_id = Number(user_id);
  }
  if (status !== undefined) {
    if (!SUBSCRIPTION_STATUSES.includes(status)) {
      return next(new AppError(`status phải là một trong: ${SUBSCRIPTION_STATUSES.join(', ')}`, 400));
    }
    filters.status = status;
  }

  req.filters = filters;
  next();
}

module.exports = {
  SUBSCRIPTION_STATUSES,
  validateIdParam,
  validateCreateTemplate,
  validateUpdateTemplate,
  validateSentHistoryQuery,
  validateCreatePlan,
  validateUpdatePlan,
  validateSubscriptionsQuery
};
