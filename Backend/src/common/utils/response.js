// src/common/utils/response.js
// Chuẩn hoá format response thành công cho toàn bộ API.
// Format lỗi được xử lý tập trung tại common/middlewares/error.middleware.js

function successResponse(res, { message = 'Thành công', data = null, statusCode = 200 } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

module.exports = { successResponse };
