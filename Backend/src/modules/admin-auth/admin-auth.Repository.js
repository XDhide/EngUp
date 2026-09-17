// src/modules/admin-auth/admin-auth.Repository.js
// Repository layer: lớp DUY NHẤT trong module Admin được phép truy vấn trực tiếp
// Sequelize model. Service không import model trực tiếp mà luôn gọi qua đây.
//
// Lưu ý nguyên tắc module độc lập:
// - User là model do Module Auth sở hữu -> ở đây CHỈ đọc (read-only) để xác thực
//   đăng nhập admin, không tạo/sửa/xoá user.
// - RefreshToken cũng là bảng dùng chung (đã được Module Auth dùng) -> Admin chỉ
//   tạo bản ghi mới khi phát hành token, không đụng tới logic khác của Auth.
// - AuditLog là model do chính Module Admin sở hữu (admin-auth.model.js).

const { User, RefreshToken, AuditLog } = require('../../common/models');

// ---- User (read-only) ----

async function findUserByEmail(email) {
  return User.findOne({ where: { email } });
}

// ---- Refresh Token ----

async function createRefreshToken({ user_id, token_hash, expires_at }) {
  return RefreshToken.create({ user_id, token_hash, expires_at });
}

// ---- Audit Log ----

async function createAuditLog({ actor_id, action, target_type, target_id, detail = null }) {
  return AuditLog.create({ actor_id, action, target_type, target_id, detail });
}

module.exports = {
  findUserByEmail,
  createRefreshToken,
  createAuditLog
};
