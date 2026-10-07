const express = require('express');
const vocabularyController = require('./vocabulary.controller');
const {
  validateListWordsQuery,
  validateCreateTopic,
  validateUpdateTopic,
  validateCreateWord,
  validateBulkCreateWords,
  validateUpdateWord,
  validateIdParam,
  validateNewWordsQuery,
  validateDailyNewWordLimit,
  validateSubmitReview
} = require('./vocabulary.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

const vocabularyRouter = express.Router();

vocabularyRouter.get('/topics', authenticateJWT, vocabularyController.getTopics);
vocabularyRouter.post('/topics', authenticateJWT, validateCreateTopic, vocabularyController.createTopic);
vocabularyRouter.put('/topics/:id', authenticateJWT, validateIdParam, validateUpdateTopic, vocabularyController.updateTopic);
vocabularyRouter.delete('/topics/:id', authenticateJWT, validateIdParam, vocabularyController.deleteTopic);
vocabularyRouter.get('/words', authenticateJWT, validateListWordsQuery, vocabularyController.getWords);
vocabularyRouter.post('/words', authenticateJWT, validateCreateWord, vocabularyController.createWord);
vocabularyRouter.post('/words/bulk', authenticateJWT, validateBulkCreateWords, vocabularyController.bulkCreateWords);
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

// Router quản trị: gắn dưới /api/admin/vocabulary (cùng handler, service tự kiểm tra role admin).
const adminVocabularyRouter = express.Router();
adminVocabularyRouter.get('/topics', vocabularyController.getTopics);
adminVocabularyRouter.post('/topics', validateCreateTopic, vocabularyController.createTopic);
adminVocabularyRouter.put('/topics/:id', validateIdParam, validateUpdateTopic, vocabularyController.updateTopic);
adminVocabularyRouter.delete('/topics/:id', validateIdParam, vocabularyController.deleteTopic);
adminVocabularyRouter.get('/words', validateListWordsQuery, vocabularyController.getWords);
adminVocabularyRouter.post('/words', validateCreateWord, vocabularyController.createWord);
adminVocabularyRouter.post('/words/bulk', validateBulkCreateWords, vocabularyController.bulkCreateWords);
adminVocabularyRouter.put('/words/:id', validateIdParam, validateUpdateWord, vocabularyController.updateWord);
adminVocabularyRouter.delete('/words/:id', validateIdParam, vocabularyController.deleteWord);

module.exports = { vocabularyRouter, reviewRouter, adminVocabularyRouter };
