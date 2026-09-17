// src/modules/admin-auth/admin-auth.controller.js
// Controller layer: chỉ nhận request -> gọi service -> trả response.
// Không chứa logic nghiệp vụ, không đụng tới model/repository trực tiếp.

const adminAuthService = require('./admin-auth.service');
const { successResponse } = require('../../common/utils/response');

// POST /api/admin/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const data = await adminAuthService.login({ email, password });

    return successResponse(res, {
      message: 'Đăng nhập quản trị thành công',
      data,
      statusCode: 200
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login
};
