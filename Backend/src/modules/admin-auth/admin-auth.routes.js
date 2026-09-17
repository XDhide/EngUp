// src/modules/admin-auth/admin-auth.routes.js
const express = require('express');
const router = express.Router();

const adminAuthController = require('./admin-auth.controller');
const { validateAdminLogin } = require('./admin-auth.validation');

// POST /api/admin/auth/login
router.post('/login', validateAdminLogin, adminAuthController.login);

module.exports = router;
