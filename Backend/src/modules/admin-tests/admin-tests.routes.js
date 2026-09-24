const express = require('express');
const adminTestsController = require('./admin-tests.controller');
const {
  validateIdParam,
  validateCreateTestSet,
  validateUpdateTestSet,
  validateCreateQuestion,
  validateUpdateQuestion,
  validateAttemptsQuery
} = require('./admin-tests.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');
const requireRole = require('../../common/middlewares/role.middleware');

const router = express.Router();

// Toàn bộ endpoint của module này chỉ dành cho admin.
router.use(authenticateJWT, requireRole('admin'));

// Đề thi
router.post('/test-sets', validateCreateTestSet, adminTestsController.createTestSet);
router.put('/test-sets/:id', validateIdParam, validateUpdateTestSet, adminTestsController.updateTestSet);
router.delete('/test-sets/:id', validateIdParam, adminTestsController.deleteTestSet);

// Câu hỏi
router.post('/questions', validateCreateQuestion, adminTestsController.createQuestion);
router.put('/questions/:id', validateIdParam, validateUpdateQuestion, adminTestsController.updateQuestion);
router.delete('/questions/:id', validateIdParam, adminTestsController.deleteQuestion);

// Thống kê lượt làm bài theo đề
router.get('/attempts', validateAttemptsQuery, adminTestsController.getAttemptStats);

module.exports = router;
