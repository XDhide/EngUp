const express = require('express');
const router = express.Router();

router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/notebook', require('../modules/notebook/notebook.routes'));
router.use('/reading', require('../modules/reading/reading.routes'));
router.use('/listening', require('../modules/listening/listening.routes'));
router.use('/writing', require('../modules/writing/writing.routes'));
router.use('/vocabulary', require('../modules/vocabulary/vocabulary.routes'));
// router.use('/vocabulary', require('../modules/vocabulary/vocabulary.routes'));

module.exports = router;