const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const { validateRegister, validateLogin, validateRefreshToken, validateUpdateProfile } = require('./auth.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

// POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// POST /api/auth/refresh
router.post('/refresh', validateRefreshToken, authController.refresh);

// POST /api/auth/logout
router.post('/logout', authenticateJWT, validateRefreshToken, authController.logout);

// GET /api/auth/me
router.get('/me', authenticateJWT, authController.getMe);

// PUT /api/auth/me
router.put('/me', authenticateJWT, validateUpdateProfile, authController.updateMe);

module.exports = router;
