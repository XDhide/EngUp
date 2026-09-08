// src/common/utils/token.js
// Tiện ích dùng chung để phát hành và xác thực JWT (access + refresh),
// đồng thời hash refresh token trước khi lưu DB (không bao giờ lưu token thô).

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

// Băm token bằng SHA-256 trước khi lưu DB (refresh_tokens.token_hash)
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Lấy thời điểm hết hạn (Date) từ claim "exp" của JWT vừa tạo
function getExpiryDateFromJwt(token) {
  const decoded = jwt.decode(token);
  return new Date(decoded.exp * 1000);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getExpiryDateFromJwt
};
