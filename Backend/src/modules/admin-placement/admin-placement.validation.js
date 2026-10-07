const AppError = require('../../common/utils/AppError');

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

function check(body, { partial }) {
  const b = body || {};
  const errors = [];
  if (!partial || b.level !== undefined) {
    if (!CEFR.includes(b.level)) errors.push(`level phải là một trong: ${CEFR.join(', ')}`);
  }
  if (!partial || b.question_text !== undefined) {
    if (typeof b.question_text !== 'string' || !b.question_text.trim()) errors.push('question_text là bắt buộc');
    else if (b.question_text.length > 1000) errors.push('question_text tối đa 1000 ký tự');
  }
  if (!partial || b.options !== undefined) {
    if (!Array.isArray(b.options) || b.options.length < 2 || b.options.length > 6) errors.push('options phải là mảng 2-6 đáp án');
    else if (b.options.some((o) => !String((o && typeof o === 'object') ? o.text : o ?? '').trim())) errors.push('Mọi đáp án phải có nội dung');
  }
  if (!partial || b.correct_option_id !== undefined) {
    if (b.correct_option_id === undefined || b.correct_option_id === null || String(b.correct_option_id).trim() === '') errors.push('correct_option_id là bắt buộc');
  }
  if (b.order_index !== undefined && (!Number.isInteger(Number(b.order_index)) || Number(b.order_index) < 0)) errors.push('order_index phải là số nguyên >= 0');
  if (b.is_active !== undefined && typeof b.is_active !== 'boolean') errors.push('is_active phải là true/false');
  if (partial && !['level', 'question_text', 'options', 'correct_option_id', 'order_index', 'is_active'].some((f) => b[f] !== undefined)) {
    errors.push('Cần ít nhất một field để cập nhật');
  }
  return errors;
}

const validateCreate = (req, res, next) => {
  const e = check(req.body, { partial: false });
  return e.length ? next(new AppError(e.join('; '), 400)) : next();
};
const validateUpdate = (req, res, next) => {
  const e = check(req.body, { partial: true });
  return e.length ? next(new AppError(e.join('; '), 400)) : next();
};
const validateIdParam = (req, res, next) => {
  if (!isPositiveInt(req.params.id)) return next(new AppError('id không hợp lệ', 400));
  req.params.id = Number(req.params.id);
  next();
};

module.exports = { validateCreate, validateUpdate, validateIdParam, CEFR };
