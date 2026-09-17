const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const { validateRegister, validateLogin, validateRefreshToken, validateUpdateProfile, validateSubmitPlacementTest } = require('./auth.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

router.post('/register', validateRegister, authController.register);

router.post('/login', validateLogin, authController.login);

router.post('/refresh', validateRefreshToken, authController.refresh);

router.post('/logout', authenticateJWT, validateRefreshToken, authController.logout);

router.get('/me', authenticateJWT, authController.getMe);

router.put('/me', authenticateJWT, validateUpdateProfile, authController.updateMe);

router.get('/placement-test/questions', authController.getPlacementTestQuestions);

router.post('/placement-test/submit', authenticateJWT, validateSubmitPlacementTest, authController.submitPlacementTest);

module.exports = router;
