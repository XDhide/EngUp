const express = require('express');
const controller = require('./admin-dashboard.controller');
const {
  validateIdParam,
  validateCreateTemplate,
  validateUpdateTemplate,
  validateSentHistoryQuery,
  validateCreatePlan,
  validateUpdatePlan,
  validateSubscriptionsQuery
} = require('./admin-dashboard.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');
const requireRole = require('../../common/middlewares/role.middleware');

// Toàn bộ endpoint của module này chỉ dành cho admin.
function createAdminRouter() {
  const router = express.Router();
  router.use(authenticateJWT, requireRole('admin'));
  return router;
}

// /api/admin/notifications
const notificationsRouter = createAdminRouter();
notificationsRouter.post('/templates', validateCreateTemplate, controller.createTemplate);
notificationsRouter.put('/templates/:id', validateIdParam, validateUpdateTemplate, controller.updateTemplate);
notificationsRouter.delete('/templates/:id', validateIdParam, controller.deleteTemplate);
notificationsRouter.get('/sent-history', validateSentHistoryQuery, controller.getSentHistory);

// /api/admin/dashboard
const dashboardRouter = createAdminRouter();
dashboardRouter.get('/overview', controller.getOverview);

// /api/admin/subscriptions
const subscriptionsRouter = createAdminRouter();
subscriptionsRouter.get('/', validateSubscriptionsQuery, controller.getSubscriptions);
subscriptionsRouter.post('/plans', validateCreatePlan, controller.createPlan);
subscriptionsRouter.put('/plans/:id', validateIdParam, validateUpdatePlan, controller.updatePlan);
subscriptionsRouter.delete('/plans/:id', validateIdParam, controller.deletePlan);

module.exports = { notificationsRouter, dashboardRouter, subscriptionsRouter };
