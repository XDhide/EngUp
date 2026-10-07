const { User, RefreshToken, AuditLog } = require('../../common/models');

async function findUserByEmail(email) {
  return User.findOne({ where: { email } });
}

async function createRefreshToken({ user_id, token_hash, expires_at }) {
  return RefreshToken.create({ user_id, token_hash, expires_at });
}

async function createAuditLog({ actor_id, action, target_type, target_id, detail = null }) {
  return AuditLog.create({ actor_id, action, target_type, target_id, detail });
}

module.exports = {
  findUserByEmail,
  createRefreshToken,
  createAuditLog
};
