// src/common/utils/password.js
// Tiện ích dùng chung để hash & verify mật khẩu (bcrypt).
// Module Auth (đăng ký/đăng nhập user) và Module Admin (đăng nhập admin)
// đều dùng chung logic này thay vì mỗi module tự import bcrypt riêng.

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function comparePassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

module.exports = {
  hashPassword,
  comparePassword
};
