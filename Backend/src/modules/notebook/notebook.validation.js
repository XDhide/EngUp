const AppError = require('../../common/utils/AppError');

const VALID_SOURCE_TYPES = ['vocabulary', 'reading', 'listening', 'manual'];

function validateCreateEntry(req, res, next) {
  const body = req.body || {};
  const errors = [];

  if (body.word_id === undefined || body.word_id === null || !Number.isInteger(body.word_id) || body.word_id <= 0) {
    errors.push('word_id phải là số nguyên dương');
  }

  if (!body.source_type || !VALID_SOURCE_TYPES.includes(body.source_type)) {
    errors.push(`source_type phải là một trong: ${VALID_SOURCE_TYPES.join(', ')}`);
  }

  if (body.source_id !== undefined && body.source_id !== null) {
    if (!Number.isInteger(body.source_id) || body.source_id <= 0) {
      errors.push('source_id phải là số nguyên dương');
    }
  }

  if (body.note !== undefined && body.note !== null && typeof body.note !== 'string') {
    errors.push('note phải là chuỗi');
  }

  if (body.tags !== undefined && body.tags !== null) {
    if (!Array.isArray(body.tags) || !body.tags.every((tag) => typeof tag === 'string')) {
      errors.push('tags phải là một mảng các chuỗi');
    }
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400));
  }

  next();
}

function validateListQuery(req, res, next) {
  const { source_type, date_from, date_to } = req.query || {};
  const errors = [];

  if (source_type !== undefined && !VALID_SOURCE_TYPES.includes(source_type)) {
    errors.push(`source_type phải là một trong: ${VALID_SOURCE_TYPES.join(', ')}`);
  }

  if (date_from !== undefined && isNaN(Date.parse(date_from))) {
    errors.push('date_from không hợp lệ');
  }

  if (date_to !== undefined && isNaN(Date.parse(date_to))) {
    errors.push('date_to không hợp lệ');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400));
  }

  next();
}

function validateIdParam(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return next(new AppError('id không hợp lệ', 400));
  }

  req.params.id = id;
  next();
}

function validateUpdateEntry(req, res, next) {
  const body = req.body || {};
  const errors = [];

  if (body.note === undefined && body.tags === undefined) {
    errors.push('Cần ít nhất một trong hai field note hoặc tags để cập nhật');
  }

  if (body.note !== undefined && body.note !== null && typeof body.note !== 'string') {
    errors.push('note phải là chuỗi');
  }

  if (body.tags !== undefined && body.tags !== null) {
    if (!Array.isArray(body.tags) || !body.tags.every((tag) => typeof tag === 'string')) {
      errors.push('tags phải là một mảng các chuỗi');
    }
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400));
  }

  next();
}

module.exports = {
  validateCreateEntry,
  validateListQuery,
  validateIdParam,
  validateUpdateEntry
};
