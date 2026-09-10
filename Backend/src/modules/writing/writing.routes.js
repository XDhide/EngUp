const express = require('express');
const router = express.Router();

const writingController = require('./writing.controller');
const {
  validateListPromptsQuery,
  validateCreateSubmission,
  validateIdParam,
  validateListSubmissionsQuery
} = require('./writing.validation');
const checkWritingQuota = require('./writing.middleware');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

router.get('/prompts', authenticateJWT, validateListPromptsQuery, writingController.getPrompts);

router.post(
  '/submissions',
  authenticateJWT,
  checkWritingQuota,
  validateCreateSubmission,
  writingController.createSubmission
);

router.get('/submissions', authenticateJWT, validateListSubmissionsQuery, writingController.getSubmissions);
router.get('/submissions/:id', authenticateJWT, validateIdParam, writingController.getSubmissionDetail);

module.exports = router;
