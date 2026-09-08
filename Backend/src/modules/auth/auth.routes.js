const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const { validateRegister, validateLogin, validateRefreshToken } = require('./auth.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

// POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// POST /api/auth/refresh
router.post('/refresh', validateRefreshToken, authController.refresh);

// POST /api/auth/logout
router.post('/logout', authenticateJWT, validateRefreshToken, authController.logout);

module.exports = router;
