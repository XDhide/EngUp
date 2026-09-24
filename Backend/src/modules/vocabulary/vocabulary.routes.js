const express = require('express');
const vocabularyController = require('./vocabulary.controller');
const {
  validateCreateTopic,
  validateUpdateTopic,
  validateListWordsQuery,
  validateCreateWord,
  validateUpdateWord,
  validateIdParam,
  validateNewWordsQuery,
  validateDailyNewWordLimit,
  validateSubmitReview
} = require('./vocabulary.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

// Theo mô tả nhiệm vụ, API chia làm 2 prefix khác nhau:
//   /api/vocabulary/...  -> topics, words, new-words, daily-new-word-limit
//   /api/review/...      -> today, submit
// Nên export 2 router riêng, mount ở routes/index.js với 2 đường dẫn khác nhau.

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

// Router CRUD dùng riêng cho Admin Content (mount ở /api/admin/vocabulary).
// Tách khỏi vocabularyRouter ở trên vì vocabularyRouter còn có route công khai
// (GET topics/words, new-words, daily-new-word-limit) không nên lộ dưới /admin.
// Controller/service bên dưới đã tự check requester.role === 'admin' (assertAdmin),
// Admin Content chỉ mount lại y hệt + có thể thêm middleware requireRole('admin')
// riêng của Module Admin Auth nếu/khi middleware đó tồn tại.
const adminVocabularyRouter = express.Router();

adminVocabularyRouter.post('/topics', authenticateJWT, validateCreateTopic, vocabularyController.createTopic);
adminVocabularyRouter.put('/topics/:id', authenticateJWT, validateIdParam, validateUpdateTopic, vocabularyController.updateTopic);
adminVocabularyRouter.delete('/topics/:id', authenticateJWT, validateIdParam, vocabularyController.deleteTopic);
adminVocabularyRouter.post('/words', authenticateJWT, validateCreateWord, vocabularyController.createWord);
adminVocabularyRouter.put('/words/:id', authenticateJWT, validateIdParam, validateUpdateWord, vocabularyController.updateWord);
adminVocabularyRouter.delete('/words/:id', authenticateJWT, validateIdParam, vocabularyController.deleteWord);

module.exports = { vocabularyRouter, reviewRouter, adminVocabularyRouter };