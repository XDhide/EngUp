// src/modules/admin-auth/admin-auth.service.js
// Service layer: chứa toàn bộ logic nghiệp vụ đăng nhập admin.
// Dùng chung logic hash/verify mật khẩu và phát hành JWT qua các thư viện
// dùng chung (common/utils), KHÔNG gọi thẳng service của Module Auth.

const { comparePassword } = require('../../common/utils/password');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getExpiryDateFromJwt
} = require('../../common/utils/token');

const adminAuthRepository = require('./admin-auth.Repository');
const AppError = require('../../common/utils/AppError');
const { toAdminUserDto } = require('./admin-auth.dtos');

// Phát hành cặp access/refresh token và lưu bản ghi refresh token (đã hash) vào DB
async function issueTokens(user) {
  const payload = { id: user.id, role: user.role };

  const access_token = generateAccessToken(payload);
  const refresh_token = generateRefreshToken(payload);

  await adminAuthRepository.createRefreshToken({
    user_id: user.id,
    token_hash: hashToken(refresh_token),
    expires_at: getExpiryDateFromJwt(refresh_token)
  });

  return { access_token, refresh_token };
}

async function login({ email, password }) {
  const user = await adminAuthRepository.findUserByEmail(email);

  // Không tiết lộ email có tồn tại hay không -> luôn trả cùng 1 message chung
  if (!user) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  if (!user.is_active) {
    throw new AppError('Tài khoản đã bị khoá', 403);
  }

  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  // Kiểm tra thêm role='admin' -> 403 nếu không phải admin
  if (user.role !== 'admin') {
    throw new AppError('Bạn không có quyền truy cập trang quản trị', 403);
  }

  const tokens = await issueTokens(user);

  // Ghi audit log cho hành động đăng nhập admin
  await adminAuthRepository.createAuditLog({
    actor_id: user.id,
    action: 'admin.login',
    target_type: 'user',
    target_id: user.id
  });

  return {
    user: toAdminUserDto(user),
    ...tokens
  };
}

module.exports = {
  login
};
