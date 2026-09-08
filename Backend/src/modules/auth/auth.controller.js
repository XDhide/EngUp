// src/modules/auth/auth.controller.js
// Controller layer: chỉ nhận request -> gọi service -> trả response.
// Không chứa logic nghiệp vụ, không đụng tới model/repository trực tiếp.

const authService = require('./auth.service');
const { successResponse } = require('../../common/utils/response');

async function register(req, res, next) {
  try {
    const { email, password, full_name } = req.body;

    const data = await authService.register({ email, password, full_name });

    return successResponse(res, {
      message: 'Đăng ký tài khoản thành công',
      data,
      statusCode: 201
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register
};
