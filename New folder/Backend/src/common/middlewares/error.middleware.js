function errorMiddleware(err, req, res, next) {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi server, vui lòng thử lại sau.'
  });
}

module.exports = errorMiddleware;