const express = require('express');
const controller = require('./contributions.controller');
const { validateReading, validateVocabulary, validateTestQuestion, validateIdParam } = require('./contributions.validation');
const authenticateJWT = require('../../common/middlewares/auth.middleware');

const router = express.Router();
router.use(authenticateJWT);

router.get('/mine', controller.listMine);
router.post('/reading', validateReading, controller.submitReading);
router.post('/vocabulary', validateVocabulary, controller.submitVocabulary);
router.post('/test-questions', validateTestQuestion, controller.submitTestQuestion);
router.delete('/:id', validateIdParam, controller.withdraw);

module.exports = router;
