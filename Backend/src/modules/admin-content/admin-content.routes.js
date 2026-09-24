const express = require('express');
const authenticateJWT = require('../../common/middlewares/auth.middleware');
const AppError = require('../../common/utils/AppError');

// ---- Vocabulary: reuse nguyên router CRUD đã có sẵn từ Module Vocabulary ----
const { adminVocabularyRouter } = require('../vocabulary/vocabulary.routes');

// ---- Reading: CRUD thủ công (đã thêm vào reading.service.js của chính bạn) ----
const readingAdminController = require('./reading-admin.controller');
const {
  validateCreateArticle,
  validateUpdateArticle,
  validateIdParam: validateReadingIdParam
} = require('./reading-admin.validation');

// ---- Listening: CRUD + upload audio (Admin Content tự quản lý riêng) ----
const listeningAdminController = require('./listening-admin.controller');
const {
  validateCreateLesson,
  validateUpdateLesson,
  validateIdParam: validateListeningIdParam
} = require('./listening-admin.validation');
const uploadAudio = require('./upload.middleware');

// Middleware chặn không phải admin — thêm 1 lớp tường minh ở tầng route theo đúng
// mô tả nhiệm vụ ("Admin Content chỉ thêm lớp requireRole('admin')"), dù service
// bên dưới cũng đã tự check req.user.role === 'admin' (assertAdmin) rồi.
// Khi Module Admin Auth có middleware requireRole() chính thức, thay dòng này bằng nó.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Chỉ admin mới có quyền truy cập', 403));
  }
  next();
}

const router = express.Router();

router.use(authenticateJWT, requireAdmin);

// /api/admin/vocabulary/topics, /api/admin/vocabulary/words
router.use('/vocabulary', adminVocabularyRouter);

// /api/admin/reading/articles
router.post('/reading/articles', validateCreateArticle, readingAdminController.createArticle);
router.put('/reading/articles/:id', validateReadingIdParam, validateUpdateArticle, readingAdminController.updateArticle);
router.delete('/reading/articles/:id', validateReadingIdParam, readingAdminController.deleteArticle);

// /api/admin/listening/lessons
router.post('/listening/lessons', validateCreateLesson, listeningAdminController.createLesson);
router.put('/listening/lessons/:id', validateListeningIdParam, validateUpdateLesson, listeningAdminController.updateLesson);
router.delete('/listening/lessons/:id', validateListeningIdParam, listeningAdminController.deleteLesson);
router.post(
  '/listening/lessons/:id/audio',
  validateListeningIdParam,
  uploadAudio.single('audio'),
  listeningAdminController.uploadAudio
);

module.exports = router;
