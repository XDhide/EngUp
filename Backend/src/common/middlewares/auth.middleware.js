// src/common/middlewares/auth.middleware.js
// Middleware xác thực JWT — chỉ module Auth sở hữu, các module khác chỉ được import và dùng,
// không được tự verify token hay đụng vào bảng users/refresh_tokens.

const { verifyAccessToken } = require('../utils/token');
const AppError = require('../utils/AppError');

// ---- authenticateJWT ----
function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Thiếu access token', 401);
    }

    const token = authHeader.split(' ')[1];

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Access token đã hết hạn', 401);
      }
      throw new AppError('Access token không hợp lệ', 401);
    }

    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticateJWT;
