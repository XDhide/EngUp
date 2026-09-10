const express = require('express');
const router = express.Router();

const listeningController = require('./listening.controller');
const {
  validateListLessonsQuery,
  validateIdParam,
  validateDictationBody
} = require('./listening.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

router.get('/lessons', authenticateJWT, validateListLessonsQuery, listeningController.getLessons);
router.get('/lessons/:id', authenticateJWT, validateIdParam, listeningController.getLessonDetail);
router.post(
  '/lessons/:id/dictation',
  authenticateJWT,
  validateIdParam,
  validateDictationBody,
  listeningController.submitDictation
);

module.exports = router;
