// src/modules/auth/auth.validation.js
// Validation layer: middleware kiểm tra dữ liệu đầu vào TRƯỚC khi vào controller/service.
// Không dùng thư viện ngoài (project chưa cài joi/express-validator) — viết tay cho nhẹ.

const AppError = require('../../common/utils/AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

module.exports = {
  validateRegister
};
