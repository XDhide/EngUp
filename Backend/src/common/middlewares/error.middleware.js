function errorMiddleware(err, req, res, next) {
  console.error(err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi server, vui lòng thử lại sau.';

  // Bắt riêng lỗi ràng buộc duy nhất / validate của Sequelize để trả message dễ hiểu hơn
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Dữ liệu đã tồn tại (trùng khoá duy nhất)';
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors?.map((e) => e.message).join('; ') || 'Dữ liệu không hợp lệ';
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null
  });
}

module.exports = errorMiddleware;