const adminAuthService = require('./admin-auth.service');
const { successResponse } = require('../../common/utils/response');

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
