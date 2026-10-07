const adminUsersService = require('./admin-users.service');
const { successResponse } = require('../../common/utils/response');

async function getUsers(req, res, next) {
  try {
    const { search, status, page } = req.query;
    const data = await adminUsersService.getUsers(req.user, { search, status, page });
    return successResponse(res, { message: 'Lấy danh sách người dùng thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getUserDetail(req, res, next) {
  try {
    const data = await adminUsersService.getUserDetail(req.user, req.params.id);
    return successResponse(res, { message: 'Lấy chi tiết người dùng thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const data = await adminUsersService.updateUserStatus(req.user, req.params.id, req.body.is_active);
    return successResponse(res, { message: 'Cập nhật trạng thái tài khoản thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

async function getUserProgress(req, res, next) {
  try {
    const data = await adminUsersService.getUserProgress(req.user, req.params.id);
    return successResponse(res, { message: 'Lấy tiến độ học tập thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  getUserDetail,
  updateUserStatus,
  getUserProgress
};
