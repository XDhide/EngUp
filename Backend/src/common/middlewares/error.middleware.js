function errorMiddleware(err, req, res, next) {
  console.error(err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi server, vui lòng thử lại sau.';

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Dữ liệu đã tồn tại (trùng khoá duy nhất)';
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors?.map((e) => e.message).join('; ') || 'Dữ liệu không hợp lệ';
  } else if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
    statusCode = 413;
    message = 'Dữ liệu tải lên quá lớn (vượt quá dung lượng cho phép của hệ thống).';
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null
  });
}

module.exports = errorMiddleware;
