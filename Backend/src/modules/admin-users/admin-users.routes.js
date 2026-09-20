const express = require('express');
const adminUsersController = require('./admin-users.controller');
const {
  validateListUsersQuery,
  validateIdParam,
  validateUpdateStatus
} = require('./admin-users.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

const router = express.Router();

router.get('/', authenticateJWT, validateListUsersQuery, adminUsersController.getUsers);
router.get('/:id', authenticateJWT, validateIdParam, adminUsersController.getUserDetail);
router.put('/:id/status', authenticateJWT, validateIdParam, validateUpdateStatus, adminUsersController.updateUserStatus);
router.get('/:id/progress', authenticateJWT, validateIdParam, adminUsersController.getUserProgress);

module.exports = router;
