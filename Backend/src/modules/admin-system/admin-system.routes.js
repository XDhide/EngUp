const express = require('express');
const service = require('./admin-system.service');
const { successResponse } = require('../../common/utils/response');
const authenticateJWT = require('../../common/middlewares/auth.middleware');
const requireRole = require('../../common/middlewares/role.middleware');

const router = express.Router();
router.use(authenticateJWT, requireRole('admin'));

const wrap = (fn, message, statusCode = 200) => async (req, res, next) => {
  try {
    return successResponse(res, { message, data: await fn(req), statusCode });
  } catch (err) {
    next(err);
  }
};

router.get('/overview', wrap((r) => service.overview(r.user), 'Tổng hợp kiểm tra hệ thống'));
router.get('/streak/check', wrap((r) => service.checkStreak(r.user), 'Kiểm tra streak xong'));
router.post('/streak/run', wrap((r) => service.runStreakNow(r.user, r.body || {}), 'Đã chạy job streak'));
router.get('/notifications/check', wrap((r) => service.checkNotifications(r.user), 'Kiểm tra thông báo xong'));
router.post('/notifications/test', wrap((r) => service.sendTestNotification(r.user, r.body || {}), 'Đã gửi thông báo thử'));
router.post('/notifications/broadcast', wrap((r) => service.broadcastNotification(r.user, r.body || {}), 'Đã gửi thông báo cho người dùng'));
router.post('/notifications/run-reminder', wrap((r) => service.runReminderNow(r.user, r.body || {}), 'Đã chạy lượt nhắc học'));
router.post('/ml/test', wrap((r) => service.runMlTestSuite(r.user, r.body || {}), 'Đã chạy bộ test ML'));
router.get('/ml/check', wrap((r) => service.checkMl(r.user), 'Kiểm tra ML xong'));

module.exports = router;
