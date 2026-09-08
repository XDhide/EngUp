const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const { validateRegister, validateLogin } = require('./auth.validation');

// POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

module.exports = router;
