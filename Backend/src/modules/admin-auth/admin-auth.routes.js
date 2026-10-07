const express = require('express');
const router = express.Router();

const adminAuthController = require('./admin-auth.controller');
const { validateAdminLogin } = require('./admin-auth.validation');

router.post('/login', validateAdminLogin, adminAuthController.login);

module.exports = router;
