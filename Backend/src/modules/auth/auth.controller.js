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

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const data = await authService.login({ email, password });

    return successResponse(res, {
      message: 'Đăng nhập thành công',
      data,
      statusCode: 200
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh
async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body;

    const data = await authService.refreshAccessToken({ refresh_token });

    return successResponse(res, {
      message: 'Làm mới access token thành công',
      data,
      statusCode: 200
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
async function logout(req, res, next) {
  try {
    const { refresh_token } = req.body;

    await authService.logout({ refresh_token });

    return successResponse(res, {
      message: 'Đăng xuất thành công',
      data: null,
      statusCode: 200
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout
};
