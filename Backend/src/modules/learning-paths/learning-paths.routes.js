const express = require('express');
const service = require('./learning-paths.service');
const AppError = require('../../common/utils/AppError');
const { successResponse } = require('../../common/utils/response');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

const router = express.Router();
router.use(authenticateJWT);

const wrap = (fn, message, statusCode = 200) => async (req, res, next) => {
  try {
    return successResponse(res, { message, data: await fn(req), statusCode });
  } catch (err) {
    next(err);
  }
};

const validId = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return next(new AppError('id không hợp lệ', 400));
  req.params.id = id;
  next();
};

const validList = (req, res, next) => {
  const { scope } = req.query;
  if (scope !== undefined && !['discover', 'enrolled', 'mine'].includes(scope)) return next(new AppError('scope phải là discover, enrolled hoặc mine', 400));
  next();
};

router.get('/', validList, wrap((r) => service.listPaths(r.user, r.query), 'Lấy danh sách lộ trình thành công'));
router.post('/', wrap((r) => service.createPath(r.user, r.body || {}), 'Tạo lộ trình thành công', 201));
router.get('/:id', validId, wrap((r) => service.getPath(r.user, r.params.id), 'Lấy lộ trình thành công'));
router.put('/:id', validId, wrap((r) => service.updatePath(r.user, r.params.id, r.body || {}), 'Cập nhật lộ trình thành công'));
router.delete('/:id', validId, wrap((r) => service.deletePath(r.user, r.params.id), 'Xóa lộ trình thành công'));
router.post('/:id/enroll', validId, wrap((r) => service.enroll(r.user, r.params.id), 'Đã tham gia lộ trình'));
router.delete('/:id/enroll', validId, wrap((r) => service.leave(r.user, r.params.id), 'Đã rời lộ trình'));

module.exports = router;
