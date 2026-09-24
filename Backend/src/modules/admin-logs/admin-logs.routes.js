const express = require('express');
const adminLogsController = require('./admin-logs.controller');
const { validateErrorLogsQuery, validateAuditLogsQuery } = require('./admin-logs.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');
const requireRole = require('../../common/middlewares/role.middleware');

const router = express.Router();

// Toàn bộ endpoint của module này chỉ dành cho admin.
router.use(authenticateJWT, requireRole('admin'));

router.get('/errors', validateErrorLogsQuery, adminLogsController.getErrorLogs);
router.get('/audit', validateAuditLogsQuery, adminLogsController.getAuditLogs);

module.exports = router;
