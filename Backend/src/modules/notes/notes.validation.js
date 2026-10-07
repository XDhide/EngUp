const AppError = require('../../common/utils/AppError');

const REF_TYPES = ['none', 'word', 'reading', 'listening', 'test'];
const COLORS = ['yellow', 'green', 'blue', 'pink', 'purple', 'gray'];

const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

function checkBody(body, { partial }) {
  const errors = [];
  const b = body || {};

  if (!partial || b.content !== undefined) {
    if (typeof b.content !== 'string' || !b.content.trim()) errors.push('content là bắt buộc');
    else if (b.content.length > 5000) errors.push('content tối đa 5000 ký tự');
  }
  if (b.title !== undefined && b.title !== null) {
    if (typeof b.title !== 'string') errors.push('title phải là chuỗi');
    else if (b.title.length > 150) errors.push('title tối đa 150 ký tự');
  }
  if (b.color !== undefined && b.color !== null && !COLORS.includes(b.color)) errors.push(`color phải là một trong: ${COLORS.join(', ')}`);
  if (b.is_pinned !== undefined && typeof b.is_pinned !== 'boolean') errors.push('is_pinned phải là true/false');
  if (b.ref_type !== undefined && !REF_TYPES.includes(b.ref_type)) errors.push(`ref_type phải là một trong: ${REF_TYPES.join(', ')}`);
  if (b.ref_id !== undefined && b.ref_id !== null && !isPositiveInt(b.ref_id)) errors.push('ref_id phải là số nguyên dương');
  if (b.ref_label !== undefined && b.ref_label !== null && String(b.ref_label).length > 255) errors.push('ref_label tối đa 255 ký tự');
  if (partial && !['content', 'title', 'color', 'is_pinned', 'ref_type', 'ref_id', 'ref_label'].some((f) => b[f] !== undefined)) {
    errors.push('Cần ít nhất một field để cập nhật');
  }
  return errors;
}

const validateCreate = (req, res, next) => {
  const errors = checkBody(req.body, { partial: false });
  return errors.length ? next(new AppError(errors.join('; '), 400)) : next();
};
const validateUpdate = (req, res, next) => {
  const errors = checkBody(req.body, { partial: true });
  return errors.length ? next(new AppError(errors.join('; '), 400)) : next();
};

function validateListQuery(req, res, next) {
  const { ref_type, pinned, limit, offset } = req.query || {};
  const errors = [];
  if (ref_type !== undefined && !REF_TYPES.includes(ref_type)) errors.push(`ref_type phải là một trong: ${REF_TYPES.join(', ')}`);
  if (pinned !== undefined && !['true', 'false'].includes(pinned)) errors.push('pinned phải là true/false');
  if (limit !== undefined && !isPositiveInt(limit)) errors.push('limit phải là số nguyên dương');
  if (offset !== undefined && (!Number.isInteger(Number(offset)) || Number(offset) < 0)) errors.push('offset phải là số nguyên >= 0');
  return errors.length ? next(new AppError(errors.join('; '), 400)) : next();
}

function validateIdParam(req, res, next) {
  if (!isPositiveInt(req.params.id)) return next(new AppError('id không hợp lệ', 400));
  req.params.id = Number(req.params.id);
  next();
}

module.exports = { validateCreate, validateUpdate, validateListQuery, validateIdParam, REF_TYPES, COLORS };
