const express = require('express');
const router = express.Router();

const { vocabularyRouter, reviewRouter } = require('../modules/vocabulary/vocabulary.routes');

router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/admin/auth', require('../modules/admin-auth/admin-auth.routes'));
router.use('/notebook', require('../modules/notebook/notebook.routes'));
// TODO: reading.controller.js / reading.dtos.js / reading.routes.js đang rỗng trong
// codebase gốc (không phải do các thay đổi admin-auth/role) -> tạm comment để server
// khởi động được. Bỏ comment sau khi hoàn thiện 3 file này.
// router.use('/reading', require('../modules/reading/reading.routes'));
router.use('/listening', require('../modules/listening/listening.routes'));
router.use('/writing', require('../modules/writing/writing.routes'));
router.use('/vocabulary', vocabularyRouter);
router.use('/review', reviewRouter);
router.use('/stats', require('../modules/statistics/statistics.routes'));

module.exports = router;