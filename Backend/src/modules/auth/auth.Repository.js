const { User, RefreshToken, PlacementTestResult } = require('../../common/models');

async function findUserByEmail(email) {
  return User.findOne({ where: { email } });
}

async function findUserById(id) {
  return User.findByPk(id);
}

async function createUser({ email, password_hash, full_name }) {
  return User.create({ email, password_hash, full_name });
}

async function updateUserById(id, fieldsToUpdate) {
  const user = await User.findByPk(id);
  if (!user) return null;

  await user.update(fieldsToUpdate);
  return user;
}

async function createRefreshToken({ user_id, token_hash, expires_at }) {
  return RefreshToken.create({ user_id, token_hash, expires_at });
}

async function findRefreshTokenByHash(token_hash) {
  return RefreshToken.findOne({ where: { token_hash } });
}

async function revokeRefreshToken(refreshTokenRecord) {
  refreshTokenRecord.revoked_at = new Date();
  return refreshTokenRecord.save();
}

async function createPlacementTestResult({ user_id, answers, suggested_level }) {
  return PlacementTestResult.create({ user_id, answers, suggested_level });
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserById,
  createRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
  createPlacementTestResult
};
