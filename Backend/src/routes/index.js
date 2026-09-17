const express = require('express');
const router = express.Router();

router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/admin/auth', require('../modules/admin-auth/admin-auth.routes'));
router.use('/notebook', require('../modules/notebook/notebook.routes'));
// TODO: reading.controller.js / reading.dtos.js / reading.routes.js đang rỗng trong
// codebase gốc (không phải do các thay đổi admin-auth/role) -> tạm comment để server
// khởi động được. Bỏ comment sau khi hoàn thiện 3 file này.
// router.use('/reading', require('../modules/reading/reading.routes'));
router.use('/listening', require('../modules/listening/listening.routes'));
router.use('/writing', require('../modules/writing/writing.routes'));
// vocabulary.routes.js export ra 2 router riêng ({ vocabularyRouter, reviewRouter }),
// không phải 1 router duy nhất -> phải mount từng cái, nếu không sẽ crash giống lỗi
// gặp phải ở module reading (argument handler must be a function).
const { vocabularyRouter, reviewRouter } = require('../modules/vocabulary/vocabulary.routes');
router.use('/vocabulary', vocabularyRouter);
router.use('/vocabulary/review', reviewRouter);

module.exports = router;