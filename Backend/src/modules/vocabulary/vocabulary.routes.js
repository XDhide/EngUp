const express = require('express');
const vocabularyController = require('./vocabulary.controller');
const {
  validateListWordsQuery,
  validateCreateWord,
  validateUpdateWord,
  validateIdParam,
  validateNewWordsQuery,
  validateDailyNewWordLimit,
  validateSubmitReview
} = require('./vocabulary.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

const vocabularyRouter = express.Router();

vocabularyRouter.get('/topics', authenticateJWT, vocabularyController.getTopics);
vocabularyRouter.get('/words', authenticateJWT, validateListWordsQuery, vocabularyController.getWords);
vocabularyRouter.post('/words', authenticateJWT, validateCreateWord, vocabularyController.createWord);
vocabularyRouter.put('/words/:id', authenticateJWT, validateIdParam, validateUpdateWord, vocabularyController.updateWord);
vocabularyRouter.delete('/words/:id', authenticateJWT, validateIdParam, vocabularyController.deleteWord);
vocabularyRouter.get('/new-words', authenticateJWT, validateNewWordsQuery, vocabularyController.getNewWords);
vocabularyRouter.put(
  '/daily-new-word-limit',
  authenticateJWT,
  validateDailyNewWordLimit,
  vocabularyController.updateDailyNewWordLimit
);

const reviewRouter = express.Router();

reviewRouter.get('/today', authenticateJWT, vocabularyController.getTodayReviewCards);
reviewRouter.post('/submit', authenticateJWT, validateSubmitReview, vocabularyController.submitReview);

module.exports = { vocabularyRouter, reviewRouter };