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
router.use('/admin/tests', require('../modules/admin-tests/admin-tests.routes'));
router.use('/admin/logs', require('../modules/admin-logs/admin-logs.routes'));
router.use('/admin/notifications', adminNotificationsRouter);
router.use('/admin/dashboard', adminDashboardRouter);
router.use('/admin/subscriptions', adminSubscriptionsRouter);
router.use('/notebook', require('../modules/notebook/notebook.routes'));
router.use('/reading', require('../modules/reading/reading.routes'));

router.use('/listening', require('../modules/listening/listening.routes'));
router.use('/writing', require('../modules/writing/writing.routes'));
router.use('/vocabulary', vocabularyRouter);
router.use('/review', reviewRouter);
router.use('/stats', require('../modules/statistics/statistics.routes'));

module.exports = router;
