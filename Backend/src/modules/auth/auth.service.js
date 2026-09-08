// src/modules/auth/auth.service.js
// Service layer: chứa toàn bộ logic nghiệp vụ. Luôn lấy/ghi dữ liệu thông qua
// auth.Repository.js, không import model trực tiếp ở đây.

const bcrypt = require('bcryptjs');
const authRepository = require('./auth.Repository');
const AppError = require('../../common/utils/AppError');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getExpiryDateFromJwt
} = require('../../common/utils/token');

const SALT_ROUNDS = 10;

// Chỉ trả về những field an toàn của user (không bao giờ trả password_hash)
function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name
  };
}

// Phát hành cặp access/refresh token và lưu bản ghi refresh token (đã hash) vào DB
async function issueTokens(user) {
  const payload = { id: user.id, role: user.role };

  const access_token = generateAccessToken(payload);
  const refresh_token = generateRefreshToken(payload);

  await authRepository.createRefreshToken({
    user_id: user.id,
    token_hash: hashToken(refresh_token),
    expires_at: getExpiryDateFromJwt(refresh_token)
  });

  return { access_token, refresh_token };
}

async function register({ email, password, full_name }) {
  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw new AppError('Email đã tồn tại', 409);
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authRepository.createUser({ email, password_hash, full_name });

  const tokens = await issueTokens(user);

  return {
    user: toPublicUser(user),
    ...tokens
  };
}

async function login({ email, password }) {
  const user = await authRepository.findUserByEmail(email);
  // Không tiết lộ email có tồn tại hay không -> luôn trả cùng 1 message chung
  if (!user) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  if (!user.is_active) {
    throw new AppError('Tài khoản đã bị khoá', 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  const tokens = await issueTokens(user);

  return {
    user: toPublicUser(user),
    ...tokens
  };
}

module.exports = {
  register,
  login
};
