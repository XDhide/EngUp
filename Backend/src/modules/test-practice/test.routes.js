const express = require('express');
const testController = require('./test.controller');
const {
  validateListTestSetsQuery,
  validateIdParam,
  validateSubmitAttempt,
  validateSubmitWriting,
  validateListAttemptsQuery
} = require('./test.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

const router = express.Router();

router.get('/attempts', authenticateJWT, validateListAttemptsQuery, testController.getAttempts);
router.get('/attempts/:id/result', authenticateJWT, validateIdParam, testController.getAttemptResult);

router.get('/', authenticateJWT, validateListTestSetsQuery, testController.getTestSets);
router.get('/:id/questions', authenticateJWT, validateIdParam, testController.getQuestions);
router.post('/:id/start', authenticateJWT, validateIdParam, testController.startAttempt);
router.post('/:id/submit', authenticateJWT, validateIdParam, validateSubmitAttempt, testController.submitAttempt);
router.post(
  '/:id/submit-writing',
  authenticateJWT,
  validateIdParam,
  validateSubmitWriting,
  testController.submitWriting
);

module.exports = router;
