// src/modules/notebook/notebook.validation.js
// Validation layer: middleware kiểm tra dữ liệu đầu vào TRƯỚC khi vào controller/service.

const AppError = require('../../common/utils/AppError');

const VALID_SOURCE_TYPES = ['vocabulary', 'reading', 'listening', 'manual'];

// ---- POST /api/notebook ----
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

module.exports = {
  validateCreateEntry
};
