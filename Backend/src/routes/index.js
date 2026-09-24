const express = require('express');
const router = express.Router();

const { vocabularyRouter, reviewRouter } = require('../modules/vocabulary/vocabulary.routes');

router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/admin/auth', require('../modules/admin-auth/admin-auth.routes'));
router.use('/admin/content', require('../modules/admin-approval/admin-approval.routes'));
router.use('/notebook', require('../modules/notebook/notebook.routes'));
router.use('/reading', require('../modules/reading/reading.routes'));

router.use('/listening', require('../modules/listening/listening.routes'));
router.use('/writing', require('../modules/writing/writing.routes'));
router.use('/vocabulary', vocabularyRouter);
router.use('/review', reviewRouter);
router.use('/stats', require('../modules/statistics/statistics.routes'));

module.exports = router;
