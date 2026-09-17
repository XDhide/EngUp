// src/common/middlewares/role.middleware.js
// Middleware phân quyền theo role — dùng SAU authenticateJWT (cần req.user đã có sẵn).
// Không tự verify token ở đây, chỉ kiểm tra req.user.role.

function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này',
        data: null
      });
    }

    next();
  };
}

module.exports = requireRole;
