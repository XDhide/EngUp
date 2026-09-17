// src/modules/admin-auth/admin-auth.validation.js
// Validation layer: kiểm tra dữ liệu đầu vào trước khi vào controller/service.
// Viết tay, không dùng thư viện ngoài, giống convention của module Auth.

const AppError = require('../../common/utils/AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateAdminLogin(req, res, next) {
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

module.exports = {
  validateAdminLogin
};
