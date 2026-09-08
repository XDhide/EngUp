// src/common/utils/AppError.js
// Lớp lỗi nghiệp vụ (operational error) — dùng để throw lỗi có statusCode rõ ràng
// từ service/controller, error.middleware.js sẽ bắt và trả về đúng format chung.

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
