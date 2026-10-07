const express = require('express');
const service = require('./learning-paths.service');
const { successResponse } = require('../../common/utils/response');
const authenticateJWT = require('../../common/middlewares/auth.middleware');
const requireRole = require('../../common/middlewares/role.middleware');

const router = express.Router();
router.use(authenticateJWT, requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const data = await service.adminList(req.user, req.query);
    return successResponse(res, { message: 'Lấy danh sách lộ trình thành công', data, statusCode: 200 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
