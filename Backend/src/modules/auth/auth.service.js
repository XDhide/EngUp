// src/modules/auth/auth.service.js
// Service layer: chứa toàn bộ logic nghiệp vụ. Luôn lấy/ghi dữ liệu thông qua
// auth.Repository.js, không import model trực tiếp ở đây.

const bcrypt = require('bcryptjs');
const authRepository = require('./auth.Repository');
const AppError = require('../../common/utils/AppError');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  getExpiryDateFromJwt
} = require('../../common/utils/token');

const { PLACEMENT_TEST_QUESTIONS, LEVEL_THRESHOLDS } = require('./placementTest.data');

const SALT_ROUNDS = 10;

// Trả về thông tin công khai tối thiểu cho register/login (không bao giờ trả password_hash)
function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name
  };
}

// Trả về đầy đủ field hồ sơ cho GET/PUT /api/auth/me (vẫn không bao giờ trả password_hash)
function toProfileUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    level_current: user.level_current,
    learning_goal: user.learning_goal,
    daily_target_minutes: user.daily_target_minutes,
    daily_new_word_limit: user.daily_new_word_limit
  };
}

// ---- Hồ sơ người dùng ----
async function getProfile(userId) {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  return toProfileUser(user);
}

async function updateProfile(userId, fieldsToUpdate) {
  const user = await authRepository.updateUserById(userId, fieldsToUpdate);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  return toProfileUser(user);
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

// ---- Refresh Token ----
async function refreshAccessToken({ refresh_token }) {
  let payload;
  try {
    payload = verifyRefreshToken(refresh_token);
  } catch (err) {
    throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn', 401);
  }

  const tokenRecord = await authRepository.findRefreshTokenByHash(hashToken(refresh_token));

  if (!tokenRecord || tokenRecord.revoked_at || tokenRecord.expires_at < new Date()) {
    throw new AppError('Refresh token đã bị thu hồi hoặc hết hạn', 401);
  }

  const user = await authRepository.findUserById(payload.id);
  if (!user || !user.is_active) {
    throw new AppError('Tài khoản không tồn tại hoặc đã bị khoá', 401);
  }

  const access_token = generateAccessToken({ id: user.id, role: user.role });

  return { access_token };
}

// ---- Logout ----
async function logout({ refresh_token }) {
  const tokenRecord = await authRepository.findRefreshTokenByHash(hashToken(refresh_token));

  if (!tokenRecord || tokenRecord.revoked_at) {
    throw new AppError('Refresh token không hợp lệ', 401);
  }

  await authRepository.revokeRefreshToken(tokenRecord);

  return null;
}

// ---- Placement Test ----

function getPlacementTestQuestions() {
  const questions = PLACEMENT_TEST_QUESTIONS.map(({ id, question_text, options }) => ({
    id,
    question_text,
    options: options.map(({ id: optionId, text }) => ({ id: optionId, text }))
  }));

  return { questions };
}

function calculateSuggestedLevel(correctCount, totalCount) {
  const percent = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
  const matched = LEVEL_THRESHOLDS.find((t) => percent >= t.minPercent);
  return matched ? matched.level : 'A1';
}

async function submitPlacementTest(userId, answers) {
  const answerByQuestionId = new Map(answers.map((a) => [Number(a.question_id), a.answer]));

  let correctCount = 0;
  PLACEMENT_TEST_QUESTIONS.forEach((q) => {
    if (answerByQuestionId.get(q.id) === q.correct_option_id) {
      correctCount += 1;
    }
  });

  const suggested_level = calculateSuggestedLevel(correctCount, PLACEMENT_TEST_QUESTIONS.length);

  await authRepository.createPlacementTestResult({
    user_id: userId,
    answers,
    suggested_level
  });

  await authRepository.updateUserById(userId, { level_current: suggested_level });

  return { suggested_level };
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getProfile,
  updateProfile,
  getPlacementTestQuestions,
  submitPlacementTest
};
