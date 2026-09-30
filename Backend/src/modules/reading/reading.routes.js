const express = require('express');
const readingController = require('./reading.controller');
const {
  validateListArticlesQuery,
  validateIdParam,
  validateSubmitAnswers,
  validateGenerateArticle
} = require('./reading.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

const router = express.Router();

router.get('/articles', authenticateJWT, validateListArticlesQuery, readingController.getArticles);
router.get('/articles/:id', authenticateJWT, validateIdParam, readingController.getArticleDetail);
router.post(
  '/articles/:id/submit',
  authenticateJWT,
  validateIdParam,
  validateSubmitAnswers,
  readingController.submitArticle
);
router.post('/generate', authenticateJWT, validateGenerateArticle, readingController.generateArticle);

module.exports = router;