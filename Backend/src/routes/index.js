const express = require('express');
const router = express.Router();

const { vocabularyRouter, reviewRouter } = require('../modules/vocabulary/vocabulary.routes');
const {
  notificationsRouter: adminNotificationsRouter,
  dashboardRouter: adminDashboardRouter,
  subscriptionsRouter: adminSubscriptionsRouter
} = require('../modules/admin-dashboard/admin-dashboard.routes');

router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/admin/auth', require('../modules/admin-auth/admin-auth.routes'));
router.use('/admin/content', require('../modules/admin-approval/admin-approval.routes'));
router.use('/admin/users', require('../modules/admin-users/admin-users.routes'));
router.use('/admin/tests', require('../modules/admin-tests/admin-tests.routes'));
router.use('/admin/logs', require('../modules/admin-logs/admin-logs.routes'));
router.use('/admin/placement', require('../modules/admin-placement/admin-placement.routes'));
router.use('/admin/system', require('../modules/admin-system/admin-system.routes'));
router.use('/admin/notifications', adminNotificationsRouter);
router.use('/admin/dashboard', adminDashboardRouter);
router.use('/admin/subscriptions', adminSubscriptionsRouter);
router.use('/notebook', require('../modules/notebook/notebook.routes'));
router.use('/reading', require('../modules/reading/reading.routes'));
router.use('/contributions', require('../modules/contributions/contributions.routes'));
router.use('/notes', require('../modules/notes/notes.routes'));

router.use('/listening', require('../modules/listening/listening.routes'));
router.use('/writing', require('../modules/writing/writing.routes'));
router.use('/tests', require('../modules/test-practice/test.routes'));
router.use('/notifications', require('../modules/notifications/notifications.routes'));
router.use('/vocabulary', vocabularyRouter);
router.use('/review', reviewRouter);
router.use('/stats', require('../modules/statistics/statistics.routes'));

// Admin Content (bài đọc /admin/reading/articles, bài nghe /admin/listening/lessons, từ vựng /admin/vocabulary).
// Router này tự gắn authenticateJWT + requireAdmin cho MỌI đường dẫn dưới /admin nên PHẢI đặt cuối cùng,
// sau tất cả router /admin/* khác, để không chặn nhầm chúng.
router.use('/admin', require('../modules/admin-content/admin-content.routes'));

module.exports = router;
