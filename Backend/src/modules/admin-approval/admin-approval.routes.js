const express = require('express');
const adminApprovalController = require('./admin-approval.controller');
const {
  validateListPendingQuery,
  validateIdParam,
  validateRejectBody
} = require('./admin-approval.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');
const requireRole = require('../../common/middlewares/role.middleware');

const router = express.Router();

// Toàn bộ endpoint của module này chỉ dành cho admin.
router.use(authenticateJWT, requireRole('admin'));

router.get('/pending', validateListPendingQuery, adminApprovalController.getPending);
router.put('/:id/approve', validateIdParam, adminApprovalController.approve);
router.put('/:id/reject', validateIdParam, validateRejectBody, adminApprovalController.reject);

module.exports = router;
