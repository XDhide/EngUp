const AppError = require('../../common/utils/AppError');

const VALID_EXAM_TYPES = ['IELTS', 'TOEIC'];
// Các loại câu hỏi mà module test-practice biết chấm (GRADABLE + AI_GRADED).
const VALID_QUESTION_TYPES = ['multiple_choice', 'fill_blank', 'essay', 'speaking_prompt'];

const MAX_UINT = 4294967295; // INTEGER UNSIGNED
const MAX_OPTIONS = 10;

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function isIntInRange(value, min, max) {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isNonEmptyString(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

// Mỗi rule trả về chuỗi lỗi hoặc null. Rule nhận giá trị đã có mặt (khác undefined).
const TEST_SET_RULES = {
  exam_type: (v) => (VALID_EXAM_TYPES.includes(v) ? null : `exam_type phải là một trong: ${VALID_EXAM_TYPES.join(', ')}`),
  section: (v) => (isNonEmptyString(v, 50) ? null : 'section phải là chuỗi không rỗng, tối đa 50 ký tự'),
  title: (v) => (isNonEmptyString(v, 255) ? null : 'title phải là chuỗi không rỗng, tối đa 255 ký tự'),
  time_limit_minutes: (v) =>
    isIntInRange(v, 1, MAX_UINT) ? null : 'time_limit_minutes phải là số nguyên dương'
};

const QUESTION_RULES = {
  test_set_id: (v) => (isIntInRange(v, 1, Number.MAX_SAFE_INTEGER) ? null : 'test_set_id phải là số nguyên dương'),
  question_text: (v) => (isNonEmptyString(v, 10000) ? null : 'question_text phải là chuỗi không rỗng, tối đa 10000 ký tự'),
  question_type: (v) =>
    VALID_QUESTION_TYPES.includes(v) ? null : `question_type phải là một trong: ${VALID_QUESTION_TYPES.join(', ')}`,
  options: (v) => {
    if (v === null) return null;
    const ok =
      Array.isArray(v) && v.length <= MAX_OPTIONS && v.every((o) => typeof o === 'string' && o.trim().length > 0);
    return ok ? null : `options phải là mảng tối đa ${MAX_OPTIONS} chuỗi không rỗng (hoặc null)`;
  },
  correct_answer: (v) => (v === null || isNonEmptyString(v, 255) ? null : 'correct_answer phải là chuỗi không rỗng, tối đa 255 ký tự (hoặc null)'),
  audio_url: (v) => (v === null || isNonEmptyString(v, 500) ? null : 'audio_url phải là chuỗi tối đa 500 ký tự (hoặc null)'),
  passage_text: (v) => (v === null || isNonEmptyString(v, 20000) ? null : 'passage_text phải là chuỗi tối đa 20000 ký tự (hoặc null)'),
  order_index: (v) => (isIntInRange(v, 0, MAX_UINT) ? null : 'order_index phải là số nguyên >= 0')
};

// Chuẩn hoá: trim các chuỗi (kể cả từng phần tử của options).
function normalize(body, field) {
  const value = body[field];
  if (typeof value === 'string') body[field] = value.trim();
  if (field === 'options' && Array.isArray(value)) body[field] = value.map((o) => (typeof o === 'string' ? o.trim() : o));
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
  if (!/^\d+$/.test(String(req.params.id)) || !isPositiveInt(req.params.id)) {
    return next(new AppError('id không hợp lệ', 400));
  }
  req.params.id = Number(req.params.id);
  next();
}

function validateCreateTestSet(req, res, next) {
  req.body = req.body || {};
  respond(runRules(req.body, TEST_SET_RULES, Object.keys(TEST_SET_RULES), false), next);
}

function validateUpdateTestSet(req, res, next) {
  req.body = req.body || {};
  respond(runRules(req.body, TEST_SET_RULES, [], true), next);
}

function validateCreateQuestion(req, res, next) {
  req.body = req.body || {};
  const required = ['test_set_id', 'question_text', 'question_type'];
  respond(runRules(req.body, QUESTION_RULES, required, false), next);
}

function validateUpdateQuestion(req, res, next) {
  req.body = req.body || {};
  respond(runRules(req.body, QUESTION_RULES, [], true), next);
}

function validateAttemptsQuery(req, res, next) {
  const { test_set_id } = req.query || {};

  if (typeof test_set_id !== 'string' || !/^\d+$/.test(test_set_id) || !isPositiveInt(test_set_id)) {
    return next(new AppError('test_set_id là bắt buộc và phải là số nguyên dương', 400));
  }
  next();
}

module.exports = {
  VALID_EXAM_TYPES,
  VALID_QUESTION_TYPES,
  validateIdParam,
  validateCreateTestSet,
  validateUpdateTestSet,
  validateCreateQuestion,
  validateUpdateQuestion,
  validateAttemptsQuery
};
