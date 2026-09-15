const express = require('express');
const notificationsController = require('./notifications.controller');
const {
  validateUpdateSettings,
  validateListNotificationsQuery,
  validateIdParam
} = require('./notifications.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

const router = express.Router();

router.get('/settings', authenticateJWT, notificationsController.getSettings);
router.put('/settings', authenticateJWT, validateUpdateSettings, notificationsController.updateSettings);

router.get('/', authenticateJWT, validateListNotificationsQuery, notificationsController.getNotifications);
router.put('/:id/read', authenticateJWT, validateIdParam, notificationsController.markAsRead);

module.exports = router;
