// src/modules/auth/auth.validation.js
// Validation layer: middleware kiểm tra dữ liệu đầu vào TRƯỚC khi vào controller/service.
// Không dùng thư viện ngoài (project chưa cài joi/express-validator) — viết tay cho nhẹ.

const AppError = require('../../common/utils/AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const ALLOWED_UPDATE_FIELDS = ['level_current', 'learning_goal', 'daily_target_minutes'];

function validateRegister(req, res, next) {
  const { email, password, full_name } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Email không hợp lệ');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }

  if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
    errors.push('Họ tên không được để trống');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400));
  }

  // Chuẩn hoá dữ liệu trước khi đưa xuống service
  req.body.email = email.trim().toLowerCase();
  req.body.full_name = full_name.trim();

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Email không hợp lệ');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Mật khẩu không được để trống');
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400));
  }

  req.body.email = email.trim().toLowerCase();

  next();
}

// ---- Refresh Token ----
function validateRefreshToken(req, res, next) {
  const { refresh_token } = req.body || {};

  if (!refresh_token || typeof refresh_token !== 'string') {
    return next(new AppError('Refresh token không được để trống', 400));
  }

  next();
}

// ---- PUT /api/auth/me ----
function validateUpdateProfile(req, res, next) {
  const body = req.body || {};
  const errors = [];

  const unknownFields = Object.keys(body).filter((field) => !ALLOWED_UPDATE_FIELDS.includes(field));
  if (unknownFields.length > 0) {
    errors.push(`Field không hợp lệ: ${unknownFields.join(', ')}`);
  }

  if (body.level_current !== undefined && !VALID_LEVELS.includes(body.level_current)) {
    errors.push('level_current phải là một trong A1, A2, B1, B2, C1, C2');
  }

  if (body.learning_goal !== undefined) {
    if (typeof body.learning_goal !== 'string' || !body.learning_goal.trim()) {
      errors.push('learning_goal không hợp lệ');
    }
  }

  if (body.daily_target_minutes !== undefined) {
    const value = body.daily_target_minutes;
    if (!Number.isInteger(value) || value <= 0) {
      errors.push('daily_target_minutes phải là số nguyên dương');
    }
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('; '), 400));
  }

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateUpdateProfile
};
